const express = require('express')
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')
const { append } = require('vary')
const { compile } = require('proxy-addr')
const { request } = require('http')
const { response } = require('express')

//Conexión con la base de datos
const pool = mysql.createPool({
    connectionLimit: 20,
    host: 'localhost',
    user: 'root',
    password: 'rukulo',
    database: 'blog_viajes'
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

//Muestra todas las publicaciones si no hay ningún criterio de búsqueda
app.get('/api/v1/publicaciones',(request,response)=>{
    pool.getConnection((err,connection)=>{
        let queryBusqueda = ''
        let queryPublicaciones = ''
        const busqueda = request.query.busqueda ? request.query.busqueda : ''
        if(busqueda != ''){
            queryBusqueda = `WHERE titulo LIKE '%${busqueda}%' OR resumen LIKE '%${busqueda}%' OR contenido LIKE '%${busqueda}%'`
        }
        queryPublicaciones = `SELECT * FROM publicaciones ${queryBusqueda}`
        connection.query(queryPublicaciones,(error,filas,campos)=>{
            response.json({data: filas})
        })
        connection.release()
    })
})

//Muestra publicaciones de acuerdo al id
app.get('/api/v1/publicaciones/:id',(request,response)=>{
    pool.getConnection((err,connection)=>{
        const publicacionId = connection.escape(request.params.id)
        const queryPublicacionesId = `SELECT * FROM publicaciones WHERE publicacionid = ${publicacionId}`
        connection.query(queryPublicacionesId,(error,filas,campos)=>{
            if(filas.length > 0){
                response.json({data: filas[0]})
            }else{
                response.status(404)
                response.send({errors: ['No se encuentra ese producto']})
            }
        })
        connection.release()
    })
})

//Muestra todos los autores
app.get('/api/v1/autores',(request, response)=>{
    pool.getConnection((err,connection)=>{
        const queryAutores = `SELECT * FROM autores`
        connection.query(queryAutores,(error,filas,campos)=>{
            response.json({data: filas})
        })
        connection.release();
    })
})

//Muestra autores de acuerdo al id
app.get('/api/v1/autores/:id',(request,response)=>{
    pool.getConnection((err,connection)=>{
        const autorId = connection.escape(request.params.id)
        const queryAutoresId = `SELECT * FROM autores WHERE id = ${autorId}`
        connection.query(queryAutoresId,(error,filas,campos)=>{
            if(filas.length > 0){
                response.json({data: filas[0]})
            }else{
                response.status(404)
                response.send({errors: ['No se encuentra ese autor']})
            }
        })
        connection.release()
    })
})

app.post('/api/v1/autores',(request,response)=>{
    pool.getConnection((err,connection)=>{
        const pseudonimo = connection.escape(request.body.pseudonimo)
        const email = connection.escape(request.body.email)
        const contrasena = connection.escape(request.body.contrasena)
        const queryAutorRepetido = `SELECT * FROM autores WHERE pseudonimo = ${pseudonimo} OR email = ${email}`
        connection.query(queryAutorRepetido,(error,filas,campos)=>{
            if(filas[0]){
                response.send({errors: ['Pseudónimo o el email ya se encuentran en uso']})
            }else{
                const queryAgregarAutor = `INSERT INTO autores (pseudonimo, email, contrasena) VALUES(${pseudonimo},${email},${contrasena})`
                connection.query(queryAgregarAutor,(error,filas,campos)=>{
                    const nuevoId = connection.escape(filas.insertId)
                    const queryAutor = `SELECT * FROM autores WHERE id = ${nuevoId}`
                    connection.query(queryAutor,(error,filas,campos)=>{
                        response.status(201)
                        response.json({data: filas[0]})
                    })
                })
            }
        })
        connection.release()
    })
})

app.listen(8080, function(){
    console.log("Servidor iniciado")
  })

/*

1. /api/v1/publicaciones desde curl

    curl -X GET -H "Content-tYpe: applicaction/json" http://localhost:8080/api/v1/publicaciones

2. /api/v1/publicaciones?busqueda=<palabra> desde curl

    curl -X GET -H "Content-tYpe: applicaction/json" http://localhost:8080/api/v1/publicaciones?busqueda=po

3. GET /api/v1/publicaciones/<id> desde curl

    curl -X GET -H "Content-tYpe: applicaction/json" http://localhost:8080/api/v1/publicaciones/7

4. GET /api/v1/autores desde curl

    curl -X GET -H "Content-tYpe: applicaction/json" http://localhost:8080/api/v1/autores

5. GET /api/v1/autores/<id> desde curl

    curl -X GET -H "Content-tYpe: applicaction/json" http://localhost:8080/api/v1/autores/10

6. POST /api/v1/autores crear autor y verificar email, pseudónimo repetidos desde curl 

    curl -X POST -H "Content-Type: application/json" -d "{\"pseudonimo\": \"yorch\", \"email\": \"yorch@email.com\", \"contrasena\": \"111222\"}" http://localhost:8080/api/v1/autores

7. POST /api/v1/publicaciones crear publicación para un autor con email y contrasena desde curl


*/