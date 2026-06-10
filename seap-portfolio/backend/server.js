const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Configurações Globais de Middleware
app.use(cors());
app.use(express.json());

// Garante que a pasta de uploads de imagens exista no servidor Hostinger
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Torna os arquivos da pasta de upload acessíveis publicamente via URL
app.use('/uploads', express.static(uploadDir));

// Configuração do Engine de Armazenamento de Imagens do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gera um nome único baseado no timestamp para evitar conflito de arquivos
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

// Conexão Segura com o Banco de Dados (Pool de Conexões)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware de Engenharia de Segurança: Validador de Token JWT
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extrai o token do formato 'Bearer TOKEN'

  if (!token) {
    return res.status(401).json({ success: false, message: "Acesso negado. Token institucional ausente." });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'seap_segredo_temporario', (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Sessão expirada ou Token inválido." });
    }
    req.user = decoded; // Salva os dados do servidor autenticado na requisição
    next();
  });
};

// Helper: Formata os dados do banco de dados para o padrão exato que o React espera ler
const mapearProdutoParaReact = (item) => {
  let specs = {};
  if (item.specifications) {
    try {
      specs = typeof item.specifications === 'string' 
        ? JSON.parse(item.specifications) 
        : item.specifications;
    } catch (e) {
      specs = {};
    }
  }

  return {
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    price: parseFloat(item.price),
    category: item.category,
    subcategory: item.subcategory,
    image: item.image_url,
    dimensions: specs.dimensions || '',
    colors: specs.colors || [],
    foods: specs.foods || [],
    drinks: specs.drinks || []
  };
};

/* ==========================================
   ROTA DE AUTENTICAÇÃO (LOGIN DO SERVIDOR)
   ========================================== */
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Preencha todos os campos." });
  }

  db.query('SELECT * FROM usuarios WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Erro interno no servidor de banco de dados." });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: "Credenciais incorretas." });
    }

    const usuario = results[0];

    // Compara a senha digitada com o hash Bcrypt salvo de forma segura no banco
    const senhaValida = await bcrypt.compare(password, usuario.password);
    if (!senhaValida) {
      return res.status(401).json({ success: false, message: "Credenciais incorretas." });
    }

    // Gera o "Crachá Virtual" (Token) válido por 2 horas
    const token = jwt.sign(
      { id: usuario.id, username: usuario.username },
      process.env.JWT_SECRET || 'seap_segredo_temporario',
      { expiresIn: '2h' }
    );

    return res.json({ success: true, token });
  });
});

/* ==========================================
   ROTAS PÚBLICAS (CATÁLOGO DE ATIVOS)
   ========================================== */
app.get('/api/produtos', (req, res) => {
  db.query('SELECT * FROM produtos ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Erro ao buscar ativos." });
    }
    const catalogoFormatado = results.map(mapearProdutoParaReact);
    res.json(catalogoFormatado);
  });
});

/* ==========================================
   ROTAS PRIVADAS / PROTEGIDAS (MODO SERVIDOR)
   ========================================== */

// 1. Criar Ativo ou Combo de Padaria
app.post('/api/produtos/create', verificarToken, upload.single('image'), (req, res) => {
  const { type, title, description, price, category, subcategory, specifications, image_url } = req.body;

  // Se um arquivo físico de imagem foi enviado, gera o link dele, caso contrário usa a URL existente
  let finalImageUrl = image_url || '';
  if (req.file) {
    finalImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  const query = `
    INSERT INTO produtos (type, title, description, price, category, subcategory, specifications, image_url) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query, 
    [type, title, description, price || 0, category || null, subcategory || null, specifications || '{}', finalImageUrl], 
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Erro de inserção no banco de dados." });
      }

      // Busca o registro recém-criado para devolver ao React estruturado
      db.query('SELECT * FROM produtos WHERE id = ?', [result.insertId], (err, current) => {
        if (err || current.length === 0) {
          return res.status(500).json({ success: false, message: "Item criado, mas houve falha ao sincronizar." });
        }
        res.json({ success: true, data: mapearProdutoParaReact(current[0]) });
      });
    }
  );
});

// 2. Atualizar Ativo Existente
app.post('/api/produtos/update', verificarToken, upload.single('image'), (req, res) => {
  const { id, type, title, description, price, category, subcategory, specifications, image_url } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID do ativo obrigatório para atualização." });
  }

  let finalImageUrl = image_url || '';
  if (req.file) {
    finalImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  const query = `
    UPDATE produtos 
    SET type = ?, title = ?, description = ?, price = ?, category = ?, subcategory = ?, specifications = ?, image_url = ? 
    WHERE id = ?
  `;

  db.query(
    query,
    [type, title, description, price || 0, category || null, subcategory || null, specifications || '{}', finalImageUrl, id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Erro de atualização no banco de dados." });
      }

      db.query('SELECT * FROM produtos WHERE id = ?', [id], (err, current) => {
        if (err || current.length === 0) {
          return res.status(500).json({ success: false, message: "Item atualizado, mas falhou ao sincronizar." });
        }
        res.json({ success: true, data: mapearProdutoParaReact(current[0]) });
      });
    }
  );
});

// 3. Deletar Ativo Definitivamente
app.delete('/api/produtos/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM produtos WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Erro ao remover o ativo do banco de dados." });
    }
    res.json({ success: true, message: "Ativo removido permanentemente do acervo institucional." });
  });
});

// Inicialização da Escuta do Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SEAP SERVIDOR] Ambiente operacional ativo na porta ${PORT}`);
});