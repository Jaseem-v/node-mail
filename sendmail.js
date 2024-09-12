const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 7000;

const corsOptions = {
    origin: ['https://actgroup.com.sa', 'https://topglobalmovers.ae', 'https://www.topglobalmovers.ae', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    allowedHeaders: ['Content-Type', ' Authorization'],
    //   credentials: true,
};

// Use CORS middleware
app.use(cors(corsOptions));
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const filetypes = /doc|docx|pdf|jpg|jpeg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Error: File type not supported!'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'formsubmissionmail@gmail.com',
        pass: 'hecvoyitjznjkosc'
    }
});

// API endpoint to send email with attachment
app.post('/send-email', upload.single('file'), (req, res) => {
    const { emailBody, email, subject } = req.body;
    const file = req.file;

    // Format the email body with HTML and inline CSS

    const mailOptions = {
        from: 'formsubmissionmail@gmail.com',
        to: email,
        subject: subject,
        html: emailBody,
        attachments: file ? [{
            filename: file.originalname,
            path: path.join(__dirname, file.path)
        }] : []
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ error: error.toString() });
        }

        // Optionally, delete the uploaded file after sending the email
        if (file) {
            fs.unlink(file.path, (err) => {
                if (err) {
                    console.error('Failed to delete temp file:', err);
                }
            });
        }

        res.status(200).json({ message: 'Email sent successfully', info });
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
