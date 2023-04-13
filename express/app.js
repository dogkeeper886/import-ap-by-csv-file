const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const url = require('url');
const cookieParser = require('cookie-parser');
const FormData = require('form-data');
const multer = require('multer');

// Started with Node.js and Express
const app = express();

// Handle the file upload and save the file to a temporary directory
const upload = multer({ storage: multer.memoryStorage() });

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

// Set up routes
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.get('/index.html', (req, res) => {
  res.render('index');
});

app.get('/requestAuthentication.html', (req, res) => {
  res.render('requestAuthentication');
});

app.get('/getVenueList.html', (req, res) => {
  res.render('getVenueList');
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
  res.redirect('/index.html');
};

app.post(('/token'), loginStep1, loginStep2);

// Define a middleware function to handle step 1 of the GET request
const venuesStep1 = async (req, res, next) => {
  // Get the value of the cookie 
  const apiUrl = req.cookies['apiUrl'];
  const token = req.cookies['token'];
  const requestUrl = apiUrl + 'venues';
  console.log('App fetch GET', requestUrl);

  const data = await fetch(requestUrl, {
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
        return response.body;
      }
    })
    .catch(error => {
      // Handle network error.
    });

  // Save the data to the request object
  //req.step1Data = { data };
  console.log('App fetch data:', data);
  res.send(data);
  // Call the next middleware function to handle step 2
  //next();
};

// Define a middleware function to handle step 2 of the GET request
const venuesStep2 = (req, res) => {
  // Get the data from step 1 from the request object
  const { data } = req.step1Data;

  // Send a response indicating that all steps are complete
  res.render('venuelist', { venues: data });
};

app.get(('/venues'), venuesStep1
);

// Define a middleware function to handle step 1 of the POST request
const importStep1 = (req, res, next) => {
  // req.file contains information about the uploaded file
  console.log('Receive file', req.file);

  // Create a new FormData object
  const formData = new FormData();

  // Append the file to the formData object
  formData.append('file', req.file.buffer, req.file.originalname);

  // Save the data to the request object
  req.step1Data = { formData };

  // Call the next middleware function to handle step 2
  next();
};

// Define a middleware function to handle step 1 of the POST request
const importStep2 = async (req, res) => {
  // Get the data from step 1 from the request object
  const { formData } = req.step1Data;

  // Get the value of the cookie 
  const apiUrl = req.cookies['apiUrl'];
  const token = req.cookies['token'];
  const importApUrl = apiUrl + 'venues/aps';

  // Make the POST request using fetch
  console.log('App fetch POST', importApUrl);
  //const data = await fetch(importApUrl, {

  const data = await fetch(importApUrl, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': token,
    }
  })
    .then(response => {
      console.log('App fetch: File uploaded successfully');
      return response.json();
    })
    .catch(error => {
      console.error('App fetch: Error uploading file:', error);
    });

  console.log('App fetch data:', data)

  // Save the data to the request object
  const requestId = data.requestId
  req.step2Data = { requestId };

  // Call the next middleware function to handle step 2
  //next();

  res.send(data);

}

// Define a middleware function to check request detail
const requestDetail = async (req, res) => {
  // Get the data from step 1 from the request object
  const { requestId } = req.step2Data

  // Get the value of the cookie 
  const apiUrl = req.cookies['apiUrl'];
  const tenantId = req.cookies['tenantId'];
  const token = req.cookies['token'];
  const requestUrl = apiUrl + 'venues/aps/importResults?requestId=' + requestId;
  // Make the POST request using fetch
  console.log('App fetch GET', requestUrl);
  const body = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Authorization': token,
    }
  })
    .then(response => {
      //console.log('File uploaded successfully');
      return response.body;
    })
    .catch(error => {
      //console.error('Error uploading file:', error);
    });

  console.log('App fetch data:', body)
  res.send(body);

}

app.post('/venues/aps', upload.single('file'), importStep1, importStep2);

app.get('/importap.html', (req, res) => {
  res.render('importap');
});

// Start server
app.listen(8080, () => {
  console.log('App listening on port 8080');
});