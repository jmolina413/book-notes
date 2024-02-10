import express from "express";
import bodyParser from "body-parser";
import { Client } from 'pg'; // Using Pool for efficient database connection pooling
import axios from "axios";
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3000;

const db = new Client({
  user: "postgres",
  host: "localhost",
  database: "booknote",
  password: "Paloma!2001",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

// Route to fetch a book cover image from Open Library API
app.get('/book/:isbn', async (req, res) => {
    const { isbn } = req.params;
    const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

    try {
        const response = await axios.get(coverUrl, { responseType: 'stream' });
        if (response.status === 200 && response.headers['content-type'] !== 'image/gif') {
            res.json({ coverUrl, message: "Cover fetched successfully" });
        } else {
            throw new Error('Cover does not exist');
        }
    } catch (error) {
        console.error('Error fetching book cover:', error);
        res.status(404).json({ message: 'Cover not found', error: error.toString() });
    }
});

async function fetchBooksFromDatabase() {
    try {
      const res = await db.query('SELECT * FROM books');
      return res.rows;
    } catch (error) {
      console.error('Error fetching books from database:', error);
      return [];
    }
}

app.get('/books', async (req, res) => {
    const books = await fetchBooksFromDatabase();
    res.render('pages/index', { books });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});