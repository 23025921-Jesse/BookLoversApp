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
        console.error('Error adding book to cart:', err.message);
        return res.status(500).send('Error adding book to cart');
      }
      console.log('Book added to cart successfully.');
      res.redirect('/cart');
    });
  });
});

// Update cart item route
app.post('/update-cart/:cartId', (req, res) => {
  const { cartId } = req.params;  
  const { quantity } = req.body;

  const sql = `UPDATE cart SET quantity = ? WHERE cartId = ?`;

  connection.query(sql, [quantity, cartId], (err, result) => {
    if (err) {
      console.error('Error updating cart item:', err.message);
      return res.status(500).send('Error updating cart item');
    }
    console.log('Cart item updated successfully.');
    res.redirect('/cart'); 
  });
});

// Route to delete from cart
app.post('/delete-from-cart/:cartId', (req, res) => {
  const { cartId } = req.params;

  const sql = `DELETE FROM cart WHERE cartId = ?`;
  connection.query(sql, [cartId], (err, result) => {
    if (err) {
      console.error('Error deleting cart item:', err.message);
      return res.status(500).send('Error deleting cart item');
    }
    console.log('Cart item deleted successfully.');
    res.redirect('/cart'); 
  });
});

// Route to render addBook page
app.get('/addBook', (req, res) => {
  res.render('addBook');
});

// Route to handle book addition
app.post('/addBook', upload.single('image'), (req, res) => {
  const { name, author, description, price, quantity, genre, reviewlink } = req.body;
  let image = req.file ? req.file.filename : null;
  const sql = 'INSERT INTO books (name, author, description, price, quantity, genre, image, reviewlink) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  
  connection.query(sql, [name, author, description, price, quantity, genre, image, reviewlink], (error, results) => {
      if (error) {
          console.error("Error adding book:", error);
          return res.status(500).send('Error adding book');
      }
      res.redirect('/allBooks');
  });
});

// Route to delete book from database and redirect to allBooks page
app.post('/delete-book/:bookId', (req, res) => {
  const { bookId } = req.params;

  const sql = `DELETE FROM books WHERE bookId = ?`;
  connection.query(sql, [bookId], (err, result) => {
    if (err) {
      console.error('Error deleting book:', err.message);
      return res.status(500).send('Error deleting book');
    }
    console.log('Book deleted successfully.');
    res.redirect('/allBooks');
  });
});

app.get('/feedback', (req, res) => {
  const sql = 'SELECT firstname, country, description FROM contact';
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Database query error:', err.message);
      return res.status(500).send('Error retrieving feedback');
    }
    res.render('feedback', { feedback: results });
  });
});

// Route for checkout process
app.get('/checkout', (req, res) => {
  res.render('checkout');
});

// Handle checkout form submission
app.post('/checkout', (req, res) => {
  const { name, email, paymentType, address } = req.body;

  // Get current date
  const orderDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Fetch items from cart
  const sqlFetchCart = 'SELECT * FROM cart';
  connection.query(sqlFetchCart, (err, cartItems) => {
    if (err) {
      console.error('Error fetching cart items:', err.message);
      return res.status(500).send('Error fetching cart items');
    }

    // Insert order into orders table
    const sqlInsertOrder = 'INSERT INTO orders (name, email, paymentType, address, orderDate) VALUES (?, ?, ?, ?, ?)';
    const values = [name, email, paymentType, address, orderDate];

    connection.query(sqlInsertOrder, values, (err, result) => {
      if (err) {
        console.error('Error inserting order:', err.message);
        return res.status(500).send('Error inserting order');
      }

      // Clear cart after successful order
      const sqlClearCart = 'DELETE FROM cart';
      connection.query(sqlClearCart, (err, result) => {
        if (err) {
          console.error('Error clearing cart:', err.message);
          return res.status(500).send('Error clearing cart');
        }

        console.log('Order placed successfully.');
        res.redirect('/'); 
      });
    });
  });
});

app.get('/orderReview', (req, res) => {
  const sql = 'SELECT * FROM orders';
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Database query error:', err.message);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
