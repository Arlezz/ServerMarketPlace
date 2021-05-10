const express = require('express');
const app = express();
const morgan = require('morgan');


//settings
app.set('port',process.env.PORT || 3000);
app.set('json spaces', 2);


//middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
 
// routes
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/images',express.static('src/res/products'));
app.use('/api/notify', require('./routes/notify'));
app.use('/api/appservices', require('./routes/appservices'));


// starting the server
app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
});

  
