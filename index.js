const express = require('express')
const app = express()
const mongo = require('mongodb')
const MongoClient = mongo.MongoClient
const places = require('./models/Places.js')

const url = 'mongodb://localhost/firstdb'

MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(client => {
    const db = client.db('firstdb')
    const placesCollection = db.collection('places')
    
    app.use(express.json())
    app.use(express.urlencoded({extended: false}))

    app.get('/', (req, res) => {
        placesCollection
        .find()
        .toArray()
        .then(val => {
            return res.status(200).json(val)
        }).catch(err => {
            return res.status(400).json(err)
        })
    })

    app.get('/remove', (req, res) => {
        placesCollection.drop()
        .then(() => {
            return res.status(200).send('Collection Dropped')
        }).catch(err => {
            return res.status(400).json(err)
        })
    })

    app.post('/create', (req, res) => {
        const addCollection = () => {
            return placesCollection
            .insertMany(places)
            .then(() => {
                return res.status(200).send('Documents Created')
            }).catch(err => {
                return res.status(400).send(err)
            })
        }

        placesCollection.drop()
        .then(addCollection)
        .catch(addCollection)
    })

    app.get('/count', (req, res) => {
        placesCollection
        .countDocuments()
        .then(num => {
            return res.status(200).send(`# of documents: ${num}`)
        }).catch(err => {
            return res.status(400).send(err)
        })
    })

    app.post('/insertone', (req, res) => {
        let {name,industry,contact,city,state,sales} = req.body
        
        const showPlaces = () => {
            return placesCollection
            .find()
            .toArray()
            .then(val => {
                return res.status(200).json(val)
            }).catch(err => {
                return res.status(400).json(err)
            })
        }
        
        placesCollection
        .insert({name,industry,contact,city,state,sales})
        .then(showPlaces)
        .catch(err => {
            return res.status(400).json(err)
        })
    })

    app.delete('/delete/:name', (req, res) => {
        let name = req.params.name
        placesCollection
        .findOneAndDelete({name})
        .then(record => {
            if (record.value===null){
                return res.status(400).send("Record doesn't exist")
            }
            return res.status(200).send('Record deleted')
        }).catch(err => {
            return res.status(400).json(err)
        })
    })

    app.get('/lessthan', (req, res) => {
        const check = { $lt: Number(req.query.search)}
        placesCollection
        .find({sales: check})
        .toArray()
        .then(places => {
            return res.status(200).json(places)
        }).catch(err => {
            return res.status(400).json(err)
        })
    })

    app.get('/sum/:industry', (req, res) => {
        placesCollection
        .find({industry: req.params.industry})
        .toArray()
        .then(places => {
            if (places.length === 0){
                return res.status(400).send("That industry doesn't exist")
            }
            let sum = 0
            for (const x of places){
                sum += x.sales
            }

            return res.status(200)
            .send(`The total number of sales for the ${req.params.industry} industry is ${sum}`)
        }).catch(err => {
            return res.status(400).json(err)
        })
    })

    app.get('/between/:low/:high', (req, res) => {
        let check = {
            $and: [
                {sales: {$gte: Number(req.params.low)}},
                {sales: {$lte: Number(req.params.high)}}
            ]} 
        placesCollection
        .find(check)
        .toArray()
        .then(places => {
            if (places.length === 0){
                return res.status(400).send("No records have sales within that range")
            }

            places.sort((a, b) => {
                return a.sales - b.sales
            })

            res.status(200).json(places)
        }).catch(err => {
            return res.status(400).json(err)
        })
    })
})

app.listen(3000, () => {
    console.log('Listening on port 3000')
})