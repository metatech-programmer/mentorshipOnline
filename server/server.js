const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Agrega estas líneas en las dependencias del servidor
const JWT_SECRET = 'tu_clave_secreta_muy_segura'; // En producción, esto debería estar en variables de ambiente


const sequelize = new Sequelize('tutorias_db', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
});

const Tutorship = sequelize.define('Tutorship', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    estudiante: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    codigo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    semestre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    asignatura: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    temas: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    compromisos: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    firma: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
    },
    docenteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    periodoAcademico: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'tutorships',
    timestamps: false,
});

const Docente = sequelize.define('Docente', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    correo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    tableName: 'docentes',
    timestamps: false,
});

Tutorship.belongsTo(Docente, {
    foreignKey: 'docenteId',
    as: 'docente'
});

Docente.hasMany(Tutorship, {
    foreignKey: 'docenteId',
    as: 'tutorships'
});

sequelize.sync().then(() => console.log('Base de datos sincronizada'));

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));

// Primero asegúrate de que el middleware authenticateToken esté definido
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Luego las rutas protegidas
app.get('/api/records', authenticateToken, async (req, res) => {
    try {
        const records = await Tutorship.findAll({
            include: [{
                model: Docente,
                as: 'docente',
                attributes: ['nombre']
            }],
            order: [['fecha', 'DESC']],
            raw: true,
            nest: true
        });
        
        const formattedRecords = records.map(record => ({
            ...record,
            docenteNombre: record.docente.nombre
        }));
        
        res.json(formattedRecords);
    } catch (error) {
        console.error('Error al obtener los registros:', error);
        res.status(500).json({ error: 'Error al obtener los registros' });
    }
});

app.get('/api/records/docente/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    
    try {
        const records = await Tutorship.findAll({
            where: {
                docenteId: userId
            },
            include: [{
                model: Docente,
                as: 'docente',
                attributes: ['nombre']
            }],
            order: [['fecha', 'DESC']],
            raw: true,
            nest: true
        });
        
        const formattedRecords = records.map(record => ({
            ...record,
            docenteNombre: record.docente.nombre
        }));
        
        res.json(formattedRecords);
    } catch (error) {
        console.error('Error al obtener los registros:', error);
        res.status(500).json({ error: 'Error al obtener los registros' });
    }
});

app.post('/api/records', authenticateToken, async (req, res) => {
    const { estudiante, codigo, semestre, asignatura, temas, compromisos, fecha, firma, periodoAcademico } = req.body;
    
    try {
        if (!firma || !firma.startsWith('data:image/png;base64,')) {
            return res.status(400).json({ error: 'Formato de firma inválido' });
        }

        const newRecord = await Tutorship.create({
            estudiante,
            codigo,
            semestre,
            asignatura,
            temas,
            compromisos,
            fecha,
            firma,
            docenteId: req.user.id,
            periodoAcademico
        });

        res.json(newRecord);
    } catch (error) {
        console.error('Error al agregar un registro:', error);
        res.status(500).json({ 
            error: 'Error al agregar un registro',
            details: error.message 
        });
    }
});

app.put('/api/records/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    try {
        const record = await Tutorship.findOne({
            where: { id }
        });

        if (!record) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        if (!req.user.isAdmin && record.docenteId !== req.user.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        await record.update(updateData);

        const updatedRecord = await Tutorship.findOne({
            where: { id },
            include: [{
                model: Docente,
                as: 'docente',
                attributes: ['nombre']
            }],
            raw: true,
            nest: true
        });

        res.json({
            ...updatedRecord,
            docenteNombre: updatedRecord.docente.nombre
        });
    } catch (error) {
        console.error('Error al editar el registro:', error);
        res.status(500).json({ error: 'Error al editar el registro' });
    }
});

app.delete('/api/records/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const record = await Tutorship.findOne({
            where: { id }
        });

        if (!record) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        if (!req.user.isAdmin && record.docenteId !== req.user.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        await record.destroy();
        res.json({ message: 'Registro eliminado' });
    } catch (error) {
        console.error('Error al eliminar el registro:', error);
        res.status(500).json({ error: 'Error al eliminar el registro' });
    }
});

app.get('/api/docentes', async (req, res) => {
    try {
        const docentes = await Docente.findAll();
        res.json(docentes);
    } catch (error) {
        console.error('Error al obtener los docentes:', error);
        res.status(500).json({ error: 'Error al obtener los docentes' });
    }
});

app.post('/api/register', async (req, res) => {
    const { nombre, correo, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    try {
        const newUser = await Docente.create({ nombre, correo, password: passwordHash });
        res.json(newUser);
    } catch (error) {
        console.error('Error al registrar al usuario:', error);
        res.status(500).json({ error: 'Error al registrar al usuario' });
    }
});


// Agrega esta ruta en tu servidor
app.post('/api/login', async (req, res) => {
    const { correo, password } = req.body;


    try {
        // Buscar el docente por correo
        const docente = await Docente.findOne({ where: { correo } });

        if (!docente) {
            return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
        }

        // Verificar la contraseña
        const isValidPassword = await bcrypt.compare(password, docente.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                id: docente.id,
                correo: docente.correo,
                isAdmin: docente.isAdmin
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Enviar respuesta
        res.json({
            token,
            user: {
                id: docente.id,
                nombre: docente.nombre,
                correo: docente.correo,
                isAdmin: docente.isAdmin
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
});

// Ejemplo de ruta protegida
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const docente = await Docente.findByPk(req.user.id);
        res.json({
            id: docente.id,
            nombre: docente.nombre,
            correo: docente.correo,
            isAdmin: docente.isAdmin
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el perfil' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

// Ruta para crear un administrador (deberías protegerla o eliminarla en producción)
app.post('/api/create-admin', async (req, res) => {
    const { nombre, correo, password } = req.body;
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const admin = await Docente.create({
            nombre,
            correo,
            password: passwordHash,
            isAdmin: true
        });
        res.json({ message: 'Administrador creado exitosamente', admin });
    } catch (error) {
        console.error('Error al crear administrador:', error);
        res.status(500).json({ error: 'Error al crear administrador' });
    }
});