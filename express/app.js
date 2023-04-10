const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();

// Set up morgan middleware to log requests
app.use(morgan('dev'));

// Set up body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up satic folder
app.use(express.static('public'));

// Set up root
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Define a middleware function to handle step 1 of the POST request
const handleStep1 = (req, res, next) => {
  // Process the request body to get data for step 2
  const { url, username, password } = req.body;

  // Save the data to the request object
  req.step1Data = { url, username, password };

  // Call the next middleware function to handle step 2
  console.log(step1Data)
  next();
};

// Define a middleware function to handle step 2 of the POST request
const handleStep2 = (req, res) => {
  // Get the data from step 1 from the request object
  const { url, username, password } = req.step1Data;

  // Process the request body to get data for step 3
  //const { password } = req.body;

  // Save the data to the request object
  //req.step2Data = { name, email, password };

  // Send a response indicating that all steps are complete
  res.send('POST request with multiple steps complete!');
};

app.post(('/login'), handleStep1, handleStep2);

// Start server
app.listen(8080, () => {
  console.log('App listening on port 8080');
});