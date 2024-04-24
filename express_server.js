const express = require('express');
const path = require('path');
const bodyParse = require('body-parser');
const session = require('express-session');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://marcochendeadalus:DO0fmayn8kOsbeSb@cluster0.1wpzl0q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const bcrypt = require('bcrypt');
const saltRounds = 16;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version

app.use(bodyParse.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // for development, set secure: true in production (requires HTTPS)
}));

app.get('/', function (req, res) {
    res.redirect('homepage.html');
})

// original
/*app.post('/signup', async (req, res) => {
    const {signupUsername, signupPassword} = req.body;

    if (signupUsername && signupPassword) {
        try {
            const client = new MongoClient(uri, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                }
            });
            // Connect the client to the server	(optional starting in v4.7)
            await client.connect();
            // Send a ping to confirm a successful connection
            await client.db("admin").command({ping: 1});
            console.log("Pinged your deployment. You successfully connected to MongoDB!")
            const new_user = {username: signupUsername, password: signupPassword};
        } finally {
            // Ensures that the client will close when you finish/error
            await client.close();
        }
        console.log('Received signup request:', signupUsername, signupPassword);
        // Respond with success message
        res.json({message: 'Signup successful'});
    } else {
        // Respond with error message
        res.json({message: 'Signup failed'});
    }
});*/

//mike's start
app.post('/signup', async (req, res) => {
    const { signupUsername, signupPassword } = req.body;

    if (signupUsername && signupPassword) {
        try {
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
            await client.connect();
            const db = client.db("health");
            // Check if username already exists
            const user = await db.collection("users").findOne({ username: signupUsername });
            if (user) {
                res.json({success: false, message: 'Username already exists' });
                return;
            }
            const hashed_password = await bcrypt.hash(signupPassword, saltRounds);
            // Insert new user if not exist
            await db.collection("users").insertOne({ username: signupUsername, password: hashed_password });
            res.json({success: true, message: 'Signup successful' });
            await client.close();
        } catch (error) {
            res.status(500).json({success: false, message: 'Error connecting to the database' });
        }
    } else {
        res.json({success: false, message: 'Signup failed' });
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { loginUsername, loginPassword } = req.body;

    if (loginUsername && loginPassword) {
        try {
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
            await client.connect();
            const db = client.db("health");
            const user = await db.collection("users").findOne({username: loginUsername});
            if (user) {
                const passwordMatch = await bcrypt.compare(loginPassword, user.password);
                if (passwordMatch){
                    req.session.username = loginUsername;
                    res.json({success: true, username: loginUsername });
                }else{
                    res.json({success: false, message: 'Wrong password'});
                }
            } else {
                res.json({success: false, message: 'Invalid username or password' });
            }
            await client.close();
        } catch (error) {
            res.status(500).json({success: false, message: 'Error connecting to the database' });
        }
    } else {
        res.json({success: false, message: 'Invalid username or password' });
    }
});
//mike's done

app.post('/logout', async (req, res) => {
    res.json({success: true, message: "Logout successful"});
})


//enter data (steps, heartrate, sleepTime, weight, height, calories, bmi)
//mike started
app.post('/submit-data', async (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    const {date, steps, heartrate, sleepTime, calories, weight, height } = req.body;

    // Calculate BMI
    const bmi = calculateBMI(weight, height);

    try {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db("health"); // Using the 'health' database
        const collection = db.collection("healthData"); // Storing health data in a separate collection

        const isoDate = new Date(date).toISOString().split('T')[0];
        const filter = {
            userName: req.session.username,
            date: isoDate  // Assuming 'date' in the document is stored in ISO date string format
        };
        // Create a document to insert
        const update = {
            $set: {
                steps,
                heartrate,
                sleepTime,
                calories,
                weight,
                height,
                bmi
            }
        };

        const options = {
            upsert: true  // Create a new document if no existing document match
        };

        // Insert the document into the collection
        const result = await collection.updateOne(filter, update, options);
        console.log(`Modified count: ${result.modifiedCount}, Upserted ID: ${result.upsertedId}`);

        res.json({ message: "Health data stored successfully!", data: update.$set });
        client.close();
    } catch (error) {
        console.error("Failed to insert or update health data in MongoDB", error);
        res.status(500).json({ message: "Failed to store health data" });
    }
});

function calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(2);
}

//mike done

app.post('/fetch-data', async (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({message: "Not authenticated"});
    }
    const {value} = req.body
    const name = req.session.username;
    try {
        const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
        await client.connect();
        const db = client.db("health"); // Using the 'health' database
        const collection = db.collection("healthData"); // Storing health data in a separate collection
        const health_data = await collection.findOne({userName: req.session.username, date: value});
        if(health_data){
            res.json({success: true, health_data: health_data});
        }else{
            res.json({success: false, message: 'no data for the given day'});
        }
        client.close();
    } catch (error) {
        console.error("Failed to insert or update health data in MongoDB", error);
        res.status(500).json({message: "Failed to store health data"});
    }
});

app.post('/fetch-data-chart', async (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({message: "Not authenticated"});
    }
    const {date} = req.body
    const name = req.session.username;
    try {
        const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
        await client.connect();
        const db = client.db("health"); // Using the 'health' database
        const collection = db.collection("healthData"); // Storing health data in a separate collection
        const sevenDaysAgo = new Date(date);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const date_str = sevenDaysAgo.getFullYear() + "-" + (sevenDaysAgo.getMonth()+1).toFixed(0).padStart(2, "0") + "-" + sevenDaysAgo.getDate();
        const isoDate = new Date(date).toISOString().split('T')[0];
        const isoDate_seven = new Date(date_str).toISOString().split('T')[0];
        const health_data = await collection.find({userName: name, date: {$gte: isoDate_seven,
        $lte: isoDate}}).toArray();
        if(health_data){
            let bmi_data = [];
            health_data.forEach(data => {
                const date = data.date;
                const bmi = data.bmi
                console.log(date + ": " + bmi);
                const new_entry = {date: date, bmi: bmi};
                bmi_data.push(new_entry);
            })
            res.json({success: true, health_data: bmi_data});
        }else{
            res.json({success: false, message: 'no data for the given day'});
        }
        client.close();
    } catch (error) {
        console.error("Failed to retrieve health data in MongoDB", error);
        res.status(500).json({message: "Failed to get health data"});
    }
});

//mike added graph
/*app.get('/api/bmi', async (req, res) => {
    try {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db("health");
        const collection = db.collection("healthData");

        // Find the most recent BMI data for the given username
        const data = await collection.findOne({userName: req.session.username, date: value});

        if (data.length > 0) {
            res.json(data[0]);
        } else {
            res.status(404).json({ message: "BMI data not found" });
        }

        client.close();
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch BMI data" });
    }
});*/
//mike added done
app.get('/api/bmi/recent', async (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    try {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db("health");
        const collection = db.collection("healthData");

        // Find the two most recent BMI records for the given username, sorted by date descending
        const records = await collection.find({userName: req.session.username})
            .sort({date: -1})
            .limit(2)
            .toArray();

        if (records.length < 2) {
            res.status(404).json({ message: "Not enough data to analyze health trend" });
        } else {
            const [newest, older] = records;
            const targetBMI = 21.7;
            const newerDistance = Math.abs(newest.bmi - targetBMI);
            const olderDistance = Math.abs(older.bmi - targetBMI);
            const message = newerDistance < olderDistance
                ? "You are getting more healthy! Keep up the good work! Staying healthy makes you live longer!"
                : "You are getting less healthy! Please try to control your Calorie intake and do more exercise!";

            // res.json({ success: true, message: message });
            res.json({
                success: true,
                message: message,
                newestBMI: newest.bmi, // Add this line
                olderBMI: older.bmi  // And this line
            });
        }
        client.close();
    } catch (error) {
        console.error("Failed to fetch BMI data", error);
        res.status(500).json({ message: "Failed to process BMI data" });
    }
});




const server = app.listen(3456);