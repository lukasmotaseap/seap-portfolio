<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Credenciais temporárias - Serão alteradas ao criar o banco na Hostinger
$host = "localhost";
$db_name = "u_seu_banco_de_dados";
$username = "u_seu_usuario";
$password = "SuaSenhaSeguraAqui";

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    echo json_encode(["success" => false, "message" => "Erro de conexão: " . $exception->getMessage()]);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : 'read';

function processAndUploadImage($fileField) {
    if (!isset($_FILES[$fileField]) || $_FILES[$fileField]['error'] !== UPLOAD_ERR_OK) {
        return null;
    }
    
    $uploadDir = '../uploads/ativos/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $tmpName = $_FILES[$fileField]['tmp_name'];
    $filename = time() . '_' . bin2hex(random_bytes(4)) . '.webp';
    $destination = $uploadDir . $filename;
    
    $imageInfo = getimagesize($tmpName);
    if (!$imageInfo) return null;
    
    switch ($imageInfo[2]) {
        case IMAGETYPE_JPEG: $srcImage = imagecreatefromjpeg($tmpName); break;
        case IMAGETYPE_PNG:  $srcImage = imagecreatefrompng($tmpName); break;
        case IMAGETYPE_GIF:  $srcImage = imagecreatefromgif($tmpName); break;
        default: return null;
    }
    
    if ($srcImage) {
        imagewebp($srcImage, $destination, 80); // Compressão nativa WebP a 80% de qualidade
        imagedestroy($srcImage);
        return 'https://' . $_SERVER['HTTP_HOST'] . '/uploads/ativos/' . $filename;
    }
    return null;
}

switch($action) {
    case 'read':
        $query = "SELECT * FROM seap_ativos ORDER BY id DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $ativos = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['id'] = (int)$row['id'];
            $row['price'] = (float)$row['price'];
            $specs = json_decode($row['specifications'], true);
            if ($specs) {
                $row = array_merge($row, $specs);
            }
            unset($row['specifications']);
            $ativos[] = $row;
        }
        echo json_encode(["success" => true, "data" => $ativos]);
        break;

    case 'create':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(["success" => false, "message" => "Método inválido."]);
            break;
        }
        
        $imageUrl = processAndUploadImage('image');
        if (!$imageUrl) $imageUrl = 'https://' . $_SERVER['HTTP_HOST'] . '/uploads/ativos/placeholder.png';
        
        $query = "INSERT INTO seap_ativos (type, category, subcategory, title, description, price, image_url, specifications) 
                  VALUES (:type, :category, :subcategory, :title, :description, :price, :image_url, :specifications)";
                  
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':type', $_POST['type']);
        $stmt->bindParam(':category', $_POST['category']);
        $stmt->bindParam(':subcategory', $_POST['subcategory']);
        $stmt->bindParam(':title', $_POST['title']);
        $stmt->bindParam(':description', $_POST['description']);
        $stmt->bindParam(':price', $_POST['price']);
        $stmt->bindParam(':image_url', $imageUrl);
        $stmt->bindParam(':specifications', $_POST['specifications']);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Ativo criado com sucesso!"]);
        } else {
            echo json_encode(["success" => false, "message" => "Erro ao persistir os dados."]);
        }
        break;

    case 'update':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(["success" => false, "message" => "Método inválido."]);
            break;
        }

        $id = (int)$_POST['id'];
        $imageUrl = processAndUploadImage('image');
        
        if ($imageUrl) {
            // Se subiu uma nova imagem, busca a antiga para apagar e manter o servidor limpo
            $findQuery = "SELECT image_url FROM seap_ativos WHERE id = :id";
            $findStmt = $conn->prepare($findQuery);
            $findStmt->bindParam(':id', $id);
            $findStmt->execute();
            $oldItem = $findStmt->fetch(PDO::FETCH_ASSOC);
            if ($oldItem) {
                $oldFile = '../uploads/ativos/' . basename($oldItem['image_url']);
                if (file_exists($oldFile) && basename($oldItem['image_url']) !== 'placeholder.png') {
                    unlink($oldFile);
                }
            }
        } else {
            $imageUrl = $_POST['image_url']; // Mantém a imagem atual se nenhuma foto nova foi enviada
        }

        $query = "UPDATE seap_ativos SET type = :type, category = :category, subcategory = :subcategory, title = :title, 
                  description = :description, price = :price, image_url = :image_url, specifications = :specifications WHERE id = :id";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':type', $_POST['type']);
        $stmt->bindParam(':category', $_POST['category']);
        $stmt->bindParam(':subcategory', $_POST['subcategory']);
        $stmt->bindParam(':title', $_POST['title']);
        $stmt->bindParam(':description', $_POST['description']);
        $stmt->bindParam(':price', $_POST['price']);
        $stmt->bindParam(':image_url', $imageUrl);
        $stmt->bindParam(':specifications', $_POST['specifications']);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Ativo modificado com sucesso!"]);
        } else {
            echo json_encode(["success" => false, "message" => "Erro ao modificar dados."]);
        }
        break;

    case 'delete':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        $findQuery = "SELECT image_url FROM seap_ativos WHERE id = :id";
        $findStmt = $conn->prepare($findQuery);
        $findStmt->bindParam(':id', $id);
        $findStmt->execute();
        $item = $findStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($item) {
            $filename = basename($item['image_url']);
            $localFilePath = '../uploads/ativos/' . $filename;
            if (file_exists($localFilePath) && $filename !== 'placeholder.png') {
                unlink($localFilePath); // Limpa o arquivo de imagem do HD do servidor
            }
            
            $query = "DELETE FROM seap_ativos WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            echo json_encode(["success" => true, "message" => "Removido com sucesso!"]);
        } else {
            echo json_encode(["success" => false, "message" => "Item não localizado."]);
        }
        break;
}
?>