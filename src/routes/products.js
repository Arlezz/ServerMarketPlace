const { Router, response } = require('express');
const router = Router();
const mysqlConnection = require('../database');
const path = require('path');
const multer = require('multer');
const intformat = require('biguint-format')
    , FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId({ epoch: 1300000000000 });
const fs = require('fs');
const { default: fetch } = require('node-fetch');
const { values } = require('underscore');
const urlCategoria = "https://api.mercadolibre.com/sites/MLC/categories";
const urlSubcategoria = "https://api.mercadolibre.com/categories/";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../res/products/'));
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    //rechaza un archivo
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter

});


//Devuelve todos los productos
router.get('/', (req, res) => {
    mysqlConnection.query('SELECT * FROM products', (err, rows, fields) => {
        if (!err) {
            (async () => {
                const aux = rows;
                for (let i = 0; i <= aux.length - 1; i++) {
                    rows[i] = await llenaImagenProducto(aux[i]);
                }
                res.json(rows);
            })();
        } else {
            console.log(err);
        }
    });
});

//Devuelve producto por id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    mysqlConnection.query('SELECT * FROM products WHERE id = ?', [id], (err, rows, fields) => {
        if (!err) {
            //res.json(rows[0]);
            (async () => {
                res.json(await llenaImagenProducto(rows[0]));
            })();
        } else {
            console.log(err);
        }
    });
    
});

function llenaImagenProducto(objeto) {
    return new Promise((resolve, reject) => {
        (async () => {
            const images = await getImagesProduct(objeto.id);
            const arrImages = new Array(images.length);

            for (let i = 0; i <= images.length - 1; i++) {
                arrImages[i] = images[i].imageProduct;
            }
            objeto.productImage = arrImages;
            return resolve(objeto);
        })();
    });
}


/*function llenaImagenProducto(lista){
    return new Promise((resolve, reject) => {
        (async () => {
            for (let i = 0; i <= lista.length - 1; i++) {

                const images = await getImagesProduct(lista[i].id);
                const arrImages = new Array(images.length);

                for(let i = 0; i <= images.length-1; i++){
                    arrImages[i] = images[i].imageProduct;
                }
                lista[i].productImage = arrImages;
            }
            return resolve(lista);
        })();
    });
}*/


//Devuelve todos los productos de un usuario por idPropietario
router.get('/owner/:owner', (req, res) => {
    const { owner } = req.params;
    mysqlConnection.query('SELECT * FROM products WHERE propietario = ?', [owner], (err, rows, fields) => {
        if (!err) {
            res.json(rows);
        } else {
            console.log(err);
        }
    });
});


//Crea un producto
router.post('/', upload.array('productImage', 5), (req, res) => {
    const obj = JSON.parse(req.body.productImage);

    const { propietario, titulo, categoria, subcategoria, descripcion, condicion, stock, precio, precioEnvio, region, comuna } = obj;
    const productImage = req.files;

    var idProduct = intformat(flakeIdGen.next(), 'hex', { prefix: '0x' });
    var nro_publicacion = getRandomInt(10000000, 90000000);

    (async () => {
        while (await verificaNroPublicacion(nro_publicacion)) {
            nro_publicacion = getRandomInt(10000000, 90000000)
        }
        const query = 'CALL productAdd(?,?,?,?,?,?,?,?,?,?,?,?,?)';
        mysqlConnection.query(query, [propietario, idProduct, nro_publicacion, titulo, categoria, subcategoria, descripcion, condicion, stock, precio, precioEnvio, region, comuna], (err, rows, fields) => {
            if (!err) {
                res.json({
                    status: "Producto guardado",
                    propietario: propietario,
                    idProduct: idProduct,
                    nro_publicacion: nro_publicacion,
                    productImage: productImage,
                    titulo: titulo,
                    categoria: categoria,
                    subcategoria: subcategoria,
                    condicion: condicion,
                    stock: stock,
                    precio: precio,
                    precioEnvio: precioEnvio,
                    region: region,
                    comuna: comuna
                });
                uploadImages(idProduct, productImage);
            } else {
                console.log(err);
            }
        });

    })();
});

router.post('/caroucel', upload.single('image'), (req, res) => {
    console.log("imagen subida")
    res.json({
        message: "imagen subida"
    });
});//borrar no sirve para nada


const uploadImages = (idProduct, productImage) => {
    for (let i = 0; i <= productImage.length - 1; i++) {
        const query = "CALL imageAdd(?,?)";
        mysqlConnection.query(query, [idProduct, productImage[i].filename], (err, rows, fields) => {
            if (!err) {
                console.log("Succes upload");
            } else {
                console.log(err);
            }
        });
    }
}


//Actualiza un producto
router.put('/:id', (req, res) => {
    const { titulo, descripcion, condicion, stock, precio, precioEnvio } = req.body;
    const { id } = req.params;
    console.log(id);
    const query = 'CALL productEdit(?,?,?,?,?,?,?)';
    mysqlConnection.query(query, [id, titulo, descripcion, condicion, stock, precio, precioEnvio], (err, rows, fields) => {
        if (!err) {
            res.json({
                status: "Producto actualizado",
                id: id,
                titulo: titulo,
                descripcion: descripcion,
                condicion: condicion,
                stock: stock,
                precio: precio,
                precioEnvio: precioEnvio
            });
        } else {
            console.log(err);
        }
    });
});


//Elimina un producto
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    mysqlConnection.query('DELETE FROM products WHERE id= ?', [id], (err, rows, fields) => {
        if (!err) {
            res.json({ status: "Producto eliminado" });
        } else {
            console.log(err);
        }

    });
    deleteImages(id);
});


function deleteImages(id) {
    deleteFromServer(id);
    mysqlConnection.query('DELETE FROM images WHERE id_Producto = ?', [id], (err, rows, fields) => {
        if (!err) {
            console.log("Recursos del producto eliminado");
        } else {
            console.log(err);
        }
    });
}

function deleteFromServer(id) {
    (async () => {
        const images = await getImagesProduct(id);
        path.join(__dirname, '../res/products/');

        for (let i = 0; i <= images.length - 1; i++) {
            fs.unlink(path.join(__dirname, '../res/products/') + images[i].imageProduct, (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log("Imagen Removido");
            })
        }
    })();
}


function getImagesProduct(id) {
    return new Promise((resolve, reject) => {
        mysqlConnection.query('SELECT imageProduct FROM images WHERE id_Producto = ?', id, (err, rows, fields) => {
            try {
                return err ? reject(err) : resolve(rows);
            } catch (e) {
                return resolve(null);
            }
        });
    });
}

//Crea el numero de publicacion
function getRandomInt(min, max) {
    return Math.floor(min + Math.random() * max);
}


//Verifica si el username ya existe
function verificaNroPublicacion(nro_publicacion) {
    return new Promise((resolve, reject) => {
        mysqlConnection.query('SELECT * FROM products WHERE nro_publicacion = ?', nro_publicacion, (err, rows, fields) => {
            try {
                return err ? reject(err) : resolve(rows[0].nro_publicacion == nro_publicacion);
            } catch (e) {
                return resolve(false);
            }
        });
    });
}


module.exports = router;