const express = require('express');
const router = express.Router();
const axios = require('axios')
const client = require('../../elasticsearch/connection');

router.get('/crime', function (req, res) {
    res.send('Running Application...');
    console.log('Loading Application...')

    //======= Check that Elasticsearch is up and running =======\\
    pingElasticsearch = async () => {
        await client.ping({
            requestTimeout: 30000,
        }, function(error,res) {
            if (error) {
                console.error('elasticsearch cluster is down!');
            } else {
                console.log('Elasticsearch Ready');
            }
        });
    }

    console.log('Getting Data From Host...')

    // ====== Get Data From USGS and then index into Elasticsearch ====== \\
    indexAllDocs = async () => {
        try {
            const date = [
                '2019-01',
                '2019-02',
                '2019-03',
                '2019-04',
                '2019-05',
                '2019-06',
                '2019-07',
                '2019-08',
                '2019-09',
                '2019-10',
                '2019-11',
                '2019-12'
            ]
            
            date.map(async month => (
                CRIME = await axios.get(`https://www.police.uk/merseyside/E5E6/crime/${month}/data/`,{
                    headers: {
                        'Content-Type': [
                            'application/json',  
                            'charset=utf-8' 
                        ]
                    }
                }),
                
                //console.log(`${month} = ${CRIME.data.length}`)

                results = CRIME.data,

                results.map(async data => (
                    crimeObject =  {
                        timestamp: month,
                        date: month,
                        category: data.category,
                        street: data.street,
                        location_id: data.location_id,
                        location: {
                            lat: data.location[1],
                            lon: data.location[0]
                        }
                    },

                    //console.log(crimeObject),

                    await client.index({ 
                        index: 'crime-data',      
                        type: '_doc',
                        body: crimeObject
                    }), (err, res, status) => {
                        console.log(res);
                    }

                ))
            ))
            console.log("All Data Has Been Indexed!")
        } catch (err) {
            console.log(err)
        };
    };

    pingElasticsearch()
    indexAllDocs()
});


module.exports = router;