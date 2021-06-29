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
app.use('/api/shoppingcart', require('./routes/shoppingcart'));
app.use('/api/notify', require('./routes/notify'));
app.use('/api/appservices', require('./routes/appservices'));
app.use('/imagesP',express.static('src/res/products'));
app.use('/imagesU',express.static('src/res/users'));

// starting the server
app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
});

