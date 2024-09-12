const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 7000;

const corsOptions = {
    origin: ['https://actgroup.com.sa','https://topglobalmovers.ae','https://www.topglobalmovers.ae', 'http://localhost:5500', 'http://127.0.0.1:5500'],
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
    const { firstName, lastName, nationality, gender, dob, qualification, email, countryCode, phone, company, designation, experience, text } = req.body;
    const file = req.file;

    // Format the email body with HTML and inline CSS
    const emailBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #1a73e8;">Job Application Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background-color: #f4f4f4;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>First Name:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${firstName}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Last Name:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${lastName}</td>
                </tr>
                <tr style="background-color: #f4f4f4;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Nationality:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${nationality}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Gender:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${gender}</td>
                </tr>
                <tr style="background-color: #f4f4f4;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date of Birth:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${dob}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Educational Qualification:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${qualification}</td>
                </tr>
                <tr style="background-color: #f4f4f4;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email Address:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${email}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Country Code:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${countryCode}</td>
                </tr>
                <tr style="background-color: #f4f4f4;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Phone Number:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${phone}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Current Company Name:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${company}</td>
                </tr>
                <tr style="background-color: #f4f4f4;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Current Designation:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${designation}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Experience:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${experience} years</td>
                </tr>
                <tr style="background-color: #f4f4f4;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Cover Letter:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${text}</td>
                </tr>
            </table>
        </div>
    `;

    const mailOptions = {
        from: 'formsubmissionmail@gmail.com',
        to: 'hr@actgroup.com.sa', // Send email to this address
        subject: 'Job Application',
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
