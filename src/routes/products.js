const { Router, response, query } = require('express');
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
        fileSize: 1024 * 1024 * 8
    },
    fileFilter: fileFilter

});


//Devuelve todos los productos
router.get('/', (req, res) => {
    mysqlConnection.query('SELECT * FROM products WHERE stock > 0', (err, rows, fields) => {
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
            objeto.images = arrImages;
            return resolve(objeto);
        })();
    });
}


//Devuelve todos los productos de un usuario por idPropietario
router.get('/owner/:owner', (req, res) => {
    const { owner } = req.params;
    mysqlConnection.query('SELECT * FROM products WHERE propietario = ?', [owner], (err, rows, fields) => {
        if (!err) {
            const arrObj = new Array(rows.length);
            (async () => {
                for (let i = 0; i < rows.length; i++) {
                    arrObj[i] = await llenaImagenProducto(rows[i]);
                }
                res.json(arrObj);

            })();
        } else {
            console.log(err);
        }
    });
});

//Devuelve todos los productos filtrado por categoria y subcategoria
router.get('/search/filter/:categoria/:subcategoria', (req, res) => {
    const { categoria, subcategoria } = req.params;
    const query = "SELECT * FROM products WHERE categoria=? AND subcategoria=? AND stock > 0";
    mysqlConnection.query(query, [categoria, subcategoria], (err, rows, fields) => {
        if (!err) {
            const arrObj = new Array(rows.length);
            (async () => {
                for (let i = 0; i < rows.length; i++) {
                    arrObj[i] = await llenaImagenProducto(rows[i]);
                }
                res.json(arrObj);
            })();
        } else {
            console.log(err);
        }
    });
});


//Publica un producto
router.post('/', upload.array('productImage', 10), (req, res) => {
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
                res.status(200).send("Producto Agregado");
                uploadImages(idProduct, productImage);
            } else {
                console.log(err);
            }
        });
    })();
});

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

router.post('/app/search/object/:busqueda',(req,res) => {
    const { busqueda } = req.params;
    const query = "SELECT * FROM products WHERE MATCH(titulo, categoria,subcategoria) AGAINST( ? )";
    //const query = "SELECT * FROM products WHERE soundex_match( ? , concat(titulo, categoria, subcategoria),' ')";
    mysqlConnection.query(query,[busqueda], (err, rows, fields) => {
        if (!err) {
            const arrObj = new Array(rows.length);
            (async () => {
                for (let i = 0; i < rows.length; i++) {
                    arrObj[i] = await llenaImagenProducto(rows[i]);
                }
                res.json(arrObj);
            })();
        } else {
            res.status(500).send("Algo ha ocurrido")
        }
    });
});

//Actualiza un producto
router.put('/update', upload.array('productImage', 10), (req, res) => {
    const obj = JSON.parse(req.body.productImage);
    const { id, titulo, descripcion, condicion, stock, precio, precioEnvio } = obj;
    const productImage = req.files;
    const query = 'CALL productEdit(?,?,?,?,?,?,?)';
    mysqlConnection.query(query, [id, titulo, descripcion, condicion, stock, precio, precioEnvio], (err, rows, fields) => {
        if (!err) {
            res.status(200).send("Producto Acttualizado");
            if(productImage.length > 0){
                uploadImages(id, productImage);
            }
        } else {
            console.log(err);
        }
    });
});


router.post('/buy/:id', (req,res) =>{
    const { id } = req.params;
    const { cantidad }  = req.body;
    const query = 'CALL productBuy(?,?)';
    mysqlConnection.query(query,[id,cantidad],(err, rows, fields) =>{
        if(!err){
            res.status(200).send("Exito al comprar");
        }else{
            res.status(500).send("Fallo al comprar");
        }
    });
});


//Elimina fotos cuando actualiza el producto
router.post('/del/resouces/:id', (req,res) => {
    const { id } = req.params;
    const resouces = req.body;
    deleteResources(id,resouces);
    res.status(200).send("resource delete");
});


//Elimina un producto
router.post('/:id', (req, res) => {
    const { id } = req.params;
    const resources = req.body;
    console.log(resources);
    mysqlConnection.query('DELETE FROM products WHERE id= ?', [id], (err, rows, fields) => {
        if (!err) {
            res.status(200).send('Producto eliminado');
        } else {
            res.status(500).send(err);
        }
    });
    deleteResources(id, resources);
});

function deleteResources(id, resouces) {
    deleteImagesDB(id,resouces);
    deleteImagesFromSV(resouces);
}

//borra todas las imagenes con el id
function deleteImagesDB(id) {
    console.log("gdfsogdsfgd");
    mysqlConnection.query('DELETE FROM images WHERE id_Producto = ?', [id], (err, rows, fields) => {
        if (!err) {
            console.log("Recursos eliminados de DB");
        } else {
            console.log(err);
        }
    });
}

//borra todas las imagenes con el id y teniendo en cuenta el nombre
function deleteImagesDB(id,resouces) {
    for(let i = 0; i < resouces.length; i++){
        mysqlConnection.query('DELETE FROM images WHERE id_Producto = ? AND imageProduct = ?', [id,resouces[i]], (err, rows, fields) => {
            if (!err) {
                console.log("Recurso eliminado de DB");
            } else {
                console.log(err);
            }
        });
    }
}

function deleteImagesFromSV(resouces) {
    console.log(resouces.length);
    for (let i = 0; i < resouces.length; i++) {
        fs.unlink(path.join(__dirname, '../res/products/') + resouces[i], (err) => {
            if (err) {
                console.error(err)
                return
            }
            console.log("Imagen Removido");
        })
    }
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