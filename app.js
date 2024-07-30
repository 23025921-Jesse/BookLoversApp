const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
require('dotenv').config(); 

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images'); 
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Create MySQL connection 
const connection = mysql.createConnection({
  host: 'bookloversapp.crzqg6ipkaum.us-east-1.rds.amazonaws.com',
  user: 'jesse23025921',
  password: 'Rajjes1518',
  database: 'bookstoreapp'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Set up view engine 
app.set('view engine', 'ejs');

// Enable static files 
app.use(express.static('public'));

// Enable form processing
app.use(express.urlencoded({ extended: false }));

// Function to fetch book details from the database based on bookId
function fetchBookDetailsFromDatabase(bookId, callback) {
  const sql = 'SELECT * FROM books WHERE bookId = ?';
  connection.query(sql, [bookId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      callback(error, null);
    } else {
      if (results.length > 0) {
        callback(null, results[0]); 
      } else {
        const notFoundError = new Error('Book not found');
        callback(notFoundError, null);
      }
    }
  });
}

// Routes
app.get('/', (req, res) => {
  connection.query('SELECT * FROM books', (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving books');
    }
    res.render('index', { books: results });
  });
});

app.get('/books/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM books WHERE bookId = ?';
  connection.query(sql, [id], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving book');
    }
    if (results.length > 0) {
      res.render('book', { book: results[0] });
    } else {
      res.status(404).send('Book not found');
    }
  });
});

app.get('/aboutUs', (req, res) => {
  res.render('aboutUs');
});

app.get('/contactUs', (req, res) => {
  res.render('contactUs');
});

app.post('/contactUs', (req, res) => {
  const { firstname, lastname, country, description } = req.body;
  const sql = 'INSERT INTO contact (firstname, lastname, country, description) VALUES (?, ?, ?, ?)';
  const values = [firstname, lastname, country, description];
  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting contact form data:', err);
      return res.status(500).send('Error submitting contact form');
    }
    console.log('Contact form data inserted successfully.');
    res.redirect('/thankYou'); 
  });
});

app.get('/thankYou', (req, res) => {
  res.render('thankYou');
});

app.get('/genres', (req, res) => {
  res.render('genres');
});

app.get('/romanceGenre', (req, res) => {
  const sql = "SELECT * FROM books WHERE genre = 'Romance'";
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Database query error:', err.message);
      return res.status(500).send('Error retrieving Romance books');
    }
    res.render('romanceGenre', { books: results });
  });
});

app.get('/fictionGenre', (req, res) => {
  const sql = "SELECT * FROM books WHERE genre = 'Fiction'";
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Database query error:', err.message);
      return res.status(500).send('Error retrieving Fiction books');
    }
    res.render('fictionGenre', { books: results });
  });
});

app.get('/horrorGenre', (req, res) => {
  const sql = "SELECT * FROM books WHERE genre = 'Horror'";
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Database query error:', err.message);
      return res.status(500).send('Error retrieving Horror books');
    }
    res.render('horrorGenre', { books: results });
  });
});

app.get('/childGenre', (req, res) => {
  const sql = "SELECT * FROM books WHERE genre = 'Children Book'";
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Database query error:', err.message);
      return res.status(500).send('Error retrieving Children Books');
    }
    res.render('childGenre', { books: results });
  });
});

app.get('/allBooks', (req, res) => {
  connection.query('SELECT * FROM books', (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving books');
    }
    res.render('allBooks', { books: results });
  });
});

app.get('/cart', (req, res) => {
  const sql = 'SELECT * FROM cart';
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Database query error:', err.message);
      return res.status(500).send('Error retrieving cart items');
    }
    res.render('cart', { cart: results });
  });
});

app.post('/add-to-cart/:bookId', (req, res) => {
  const { bookId } = req.params;
  const { quantity } = req.body;

  fetchBookDetailsFromDatabase(bookId, (error, book) => {
    if (error) {
      console.error('Error fetching book details:', error.message);
      return res.status(500).send('Error fetching book details');
    }

    const sql = `INSERT INTO cart (name, quantity, price) VALUES (?, ?, ?)`;
    const values = [book.name, quantity, book.price];
    connection.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error adding item to cart:', err.message);
        return res.status(500).send('Error adding item to cart');
      }
      console.log('Item added to cart successfully.');
      res.redirect('/cart'); 
    });
  });
});

app.post('/cart/update', (req, res) => {
  const { cartId, quantity } = req.body;
  const sql = 'UPDATE cart SET quantity = ? WHERE cartId = ?';
  connection.query(sql, [quantity, cartId], (err, result) => {
    if (err) {
      console.error('Error updating cart item:', err.message);
      return res.status(500).send('Error updating cart item');
    }
    console.log('Cart item updated successfully.');
    res.redirect('/cart'); 
  });
});

app.post('/cart/delete/:cartId', (req, res) => {
  const { cartId } = req.params;
  const sql = 'DELETE FROM cart WHERE cartId = ?';
  connection.query(sql, [cartId], (err, result) => {
    if (err) {
      console.error('Error deleting cart item:', err.message);
      return res.status(500).send('Error deleting cart item');
    }
    console.log('Cart item deleted successfully.');
    res.redirect('/cart'); 
  });
});

app.get('/checkout', (req, res) => {
  res.render('checkout');
});

app.post('/checkout', (req, res) => {
  const { name, email, paymentType, address } = req.body;
  const orderDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const sql = 'INSERT INTO orders (name, email, paymentType, address, orderDate) VALUES (?, ?, ?, ?, ?)';
  const values = [name, email, paymentType, address, orderDate];

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting order:', err.message);
      return res.status(500).send('Error processing order');
    }
    console.log('Order placed successfully.');
    res.redirect('/orderConfirmation');
  });
});

app.get('/orderConfirmation', (req, res) => {
  res.render('orderConfirmation');
});

app.get('/orderReview', (req, res) => {
  const sql = 'SELECT * FROM orders';
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error retrieving orders:', err.message);
      return res.status(500).send('Error retrieving orders');
    }
    res.render('orderReview', { orders: results });
  });
});

// Route to delete an order
app.post('/delete-order/:orderId', (req, res) => {
  const { orderId } = req.params;

  const sql = `DELETE FROM orders WHERE orderId = ?`;
  connection.query(sql, [orderId], (err, result) => {
    if (err) {
      console.error('Error deleting order:', err.message);
      return res.status(500).send('Error deleting order');
    }
    console.log('Order deleted successfully.');
    res.redirect('/orderReview'); 
  });
});

// Start the server 
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
