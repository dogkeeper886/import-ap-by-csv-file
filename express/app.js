const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const url = require('url');
const cookieParser = require('cookie-parser');

const app = express();

// Set up morgan middleware to log requests
app.use(morgan('dev'));

// Set up body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up cookie to store small amounts of data on the client-side
app.use(cookieParser());

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set up satic folder
app.use(express.static('public'));

// Set up root
app.get('/', (req, res) => {
  // res.send('Hello World!');
  res.redirect('/index.html');
});

// Set up index.html
app.get('/index.html', (req, res) => {
  res.render('index');
});

// Set up dashboard
app.get('/dashboard.html', (req, res) => {
  res.render('dashboard');
});

// Define a middleware function to handle step 1 of the POST request
const loginStep1 = async (req, res, next) => {
  // Process the request body to get data for step 2
  const { hosturl, username, password } = req.body;

  // Prepare login data
  const data = {
    username: username,
    password: password
  };

  const parsedUrl = url.parse(hosturl, true);
  const loginUrl = parsedUrl.href + 'token';
  console.log('App fetch POST ', loginUrl);
  const { tenantId, jwt } = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (response.ok) {
        // Success! User is logged in.
        return response.json();
      } else {
        // Handle error response from server.
      }
    })
    .catch(error => {
      // Handle network error.
    });

  // Save the data to the request object
  const apiUrl = parsedUrl.protocol + '//' + 'api.' + parsedUrl.host + parsedUrl.path;
  req.step1Data = { apiUrl, tenantId, jwt };
  console.log('App fetch data:', req.step1Data)

  // Call the next middleware function to handle step 2
  next();
};

// Define a middleware function to handle step 2 of the POST request
const loginStep2 = (req, res) => {
  // Get the data from step 1 from the request object
  const { apiUrl, tenantId, jwt } = req.step1Data;

  // Set a cookie with the name and the value
  res.cookie('apiUrl', apiUrl);
  res.cookie('tenantId', tenantId);

  // Setup the bearer token 
  const token = 'Bearer ' + jwt;
  res.cookie('token', token);

  // Send a response indicating that all steps are complete
  res.redirect('/dashboard.html');
};

app.post(('/login'), loginStep1, loginStep2);

// Define a middleware function to handle step 1 of the GET request
const venuesStep1 = async (req, res, next) => {
  // Get the value of the cookie with the name 'myCookie'
  const apiUrl = req.cookies['apiUrl'];
  const token = req.cookies['token'];
  const veunesUrl = apiUrl + 'venues';
  console.log('App fetch GET', veunesUrl);

  const data = await fetch(veunesUrl, {
    headers: {
      method: 'GET',
      'Authorization': token
    }
  })
    .then(response => {
      if (response.ok) {
        // Success!
        return response.json();
      } else {
        // Handle error response from server.
      }
    })
    .catch(error => {
      // Handle network error.
    });

  // Save the data to the request object
  req.step1Data = { data };
  console.log('App fetch data:', data);

  // Call the next middleware function to handle step 2
  next();
};

// Define a middleware function to handle step 2 of the GET request
const venuesStep2 = (req, res) => {
  // Get the data from step 1 from the request object
  const { data } = req.step1Data;

  // Send a response indicating that all steps are complete
  res.render('venuelist', { venues: data });
};

app.get(('/venues'), venuesStep1, venuesStep2);

app.post('/venues/aps');

app.get('/importap.html', (req, res) => {
  res.render('importap');
});

// Start server
app.listen(8080, () => {
  console.log('App listening on port 8080');
});