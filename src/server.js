import express from "express";
import fs from 'fs';
import admin from 'firebase-admin';

const credentials = JSON.parse(
    fs.readFileSync('./credentials.json')
);

admin.initializeApp({
    credential: admin.credential.cert(credentials),
});

const app = express();
app.use(express.json())

app.use( async (req, res, next) => {
    const { authtoken } = req.headers;
    req.user = {};
    if (authtoken) {
        try {
            req.user = await admin.auth().verifyIdToken(authtoken);
        } catch (e) {
            return res.sendStatus(400);
        }
    }
    
    next();
});
 
let articleInfo = [ {
    name : "learn-react",
    upvote: 1,
    comments: [{postedby: "A", text:"a"}],
    upvoteIds: [],
}, {
    name : "learn-node",
    upvote: 2,
    comments: [{postedby: "A", text:"a"}, {postedby: "B", text:"b"}],
    upvoteIds: [],
}, {
    name : "mongodb",
    upvote: 3,
    comments: [{postedby: "A", text:"a"}, {postedby: "B", text:"b"}, {postedby: "C", text:"c"}],
    upvoteIds: [],
}];

app.get('/api/articles/:name', async (req, res) => {
    const { name } = req.params;
    const { uid } = req.user;

    const article = articleInfo.find(article => article.name === name);
    console.log(req.user);
    if (article) {
        article.canUpvote = uid && !article.upvoteIds.includes(uid);
        res.json(article);
    } else {
        res.sendStatus(404);
    }
});

app.use((req, res, next) => {
    if (req.user) {
        next();
    }
    else {
        res.sendStatus(401);
    }
});

app.put('/api/articles/:name/upvote', (req, res) => {
    const {name} = req.params;
    const {uid} = req.user;
    console.log(req.user);
    const article = articleInfo.find(article => article.name === name);
    
    if (article) {
        const canUpvote = uid && !article.upvoteIds.includes(uid);
        if (canUpvote) {
            article.upvote += 1;
            article.upvoteIds.push(uid);

        }
        
        const updatedArticle = articleInfo.find(article => article.name === name);
        res.json(updatedArticle)
    }
    else{
        res.send(`No ${name} article found.`);
    }
    
     
});

app.post('/api/articles/:name/comments', (req, res) => {
    const { name } = req.params;
    const { postedby, text } = req.body;
    const {email} = req.user;


    const article = articleInfo.find(a => a.name === name);
    if (article) {
        article.comments.push({ postedby: email, text });
        res.send(article);
    }
    else {
        res.send(`No ${name} article found!!!`);
    }
    
});

app.listen(8000, () => {
    console.log('server is listing on port 8000!!!');
});
