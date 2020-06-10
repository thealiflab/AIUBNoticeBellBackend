const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
require('dotenv').config();
const {Pool} = require('pg');

const connectURI = "postgres://xnyhqsdgfkgbbi:82b53469e34e73b89dd7a77bd035cd54c41ee10f9e958e86145f51f500c94b2e@ec2-54-247-79-178.eu-west-1.compute.amazonaws.com:5432/d3rf1g2ceonf2s";

const pool = new Pool({
    connectionString: connectURI,
    ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, done) => {
    if(err){
        console.log("Postgres error which is: "+err);
    }
    else{
        console.log("Postgres Connection successfull...");
        done();
    }
});

//table created on 10 June, 2020
// pool.query('CREATE TABLE aiubnotice (noticetitle VARCHAR (2000) NOT NULL);',(err,res) => {
//     if(err){
//         console.log("Table creation error which is: "+err);
//     }
//     else{
//         console.log('Table creation successful.');
//     }
// });

const aiubNoticeURL = 'https://www.aiub.edu/category/notices';

var noticeTitle, noticeDesc, postURL, day, month, year;
var lastNoticeTitle;
var dateObj, cday, cmonth, cyear; //for current date
var timeObj, chour, cminute, ampm; //for watch time
const monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var countCronjobHour = -1;

$PORT = process.env.PORT || 5000;

//pupp
async function configureBrowser(){
    try{
        const browser = await puppeteer.launch({
            headless: true,
            'args' : [
                '--no-sandbox',
                '--disable-setuid-sandbox'
              ]
        });
        const page = await browser.newPage();
        await page.goto(aiubNoticeURL);
    
        page.waitForSelector("#frame > div > div.row > div.col-xs-12.col-sm-12.col-md-9.pull-right > ul > li:nth-child(1)").then(async function(){
            noticeTitle = await page.$eval("#frame > div > div.row > div.col-xs-12.col-sm-12.col-md-9.pull-right > ul > li:nth-child(1) > div.info > h2", element => element.innerHTML);
            noticeDesc = await page.$eval("#frame > div > div.row > div.col-xs-12.col-sm-12.col-md-9.pull-right > ul > li:nth-child(1) > div.info > p", element => element.innerHTML);
            day = await page.$eval("#frame > div > div.row > div.col-xs-12.col-sm-12.col-md-9.pull-right > ul > li:nth-child(1) > time > span.day", element => element.innerHTML);
            month = await page.$eval("#frame > div > div.row > div.col-xs-12.col-sm-12.col-md-9.pull-right > ul > li:nth-child(1) > time > span.month", element => element.innerHTML);
            year = await page.$eval("#frame > div > div.row > div.col-xs-12.col-sm-12.col-md-9.pull-right > ul > li:nth-child(1) > time > span.year", element => element.innerHTML);
            postURL = await page.$$eval('#frame > div > div.row > div.col-xs-12.col-sm-12.col-md-9.pull-right > ul > li:nth-child(1) > a', e=>e.map((a)=>a.href))

            
            //Current Date Calculate
            dateObj = new Date();
            cday = dateObj.getUTCDate();
            cmonth = dateObj.getUTCMonth();
            cyear = dateObj.getUTCFullYear();

            function watchTime(){
                timeObj = new Date();
                chour = timeObj.getHours() + 6;  //+6 added for Heroku server to respond in UTC Asia/Dhaka
                cminute = timeObj.getUTCMinutes();
                ampm = "AM";
            
                if (cminute < 10){
                    cminute = "0" + cminute;
                }
            
                if(chour > 12){
                    chour -= 12;
                    ampm = "PM";
                }
            
                console.log(`Current Time: ${chour}:${cminute} ${ampm}`);
            }

            //nodemailer
            //before pushing, set pass as password
            var transporter = nodemailer.createTransport(smtpTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 465,
                secure: true, 
                auth: {
                  user: 'imhero48@gmail.com',
                  pass: 'asdf_54321A'
                }
              }));

            var mailOptions = {
                from: 'AIUB Notice Bell <imhero48@gmail.com>',
                to: 'geekalif@gmail.com',
                subject: 'New Notice',
                text: `${noticeTitle}`,
                html: `<b>${noticeTitle}</b><br><br>Notice Date: ${day} ${month},${year}<br><br>See full notice: ${postURL}<br><br><img src="cid:ahmedalif.com"/>`,
                attachments: [
                    {
                        filename: 'logo.png',
                        path: './assets/logo.png',
                        cid: 'ahmedalif.com'
                    }
                ],
            };

            sendMailFinal = function(){
                transporter.sendMail(mailOptions,function(err,data){
                    if(err){
                        console.log("Send Faild. reason: "+err);
                    }
                    else{
                        console.log("Mail send successfully");
                    }
                });
            }

            //clear database's data
            function noticeClear(){
                pool.query("UPDATE aiubnotice SET noticetitle=null;",(err,res) => {
                    if(err){
                        console.log("Table clear error which is: "+err);
                    }
                    else{
                        console.log("Table cleared successfully");
                    }
                });
            }
            
            //insertion data to database
            function noticeInsertion(){
                pool.query("INSERT INTO aiubnotice (noticetitle) VALUES ('"+noticeTitle+"');",(err,res) => {
                    if(err){
                        console.log("Table insertion error which is: "+err);
                    }
                    else{
                        console.log('Table insertion successful.');
                        console.log('Your inserted notice title is: '+noticeTitle);
                    }
                });
            }
 
            function centralProcessing(lastNoticeTitle){
                var lnt = lastNoticeTitle;

                if(lnt != noticeTitle){

                    console.log(`${day} ${month},${year}`);
                    console.log(noticeTitle);
                    console.log(noticeDesc);
                    console.log("See full post: "+postURL);
                    watchTime();

                    noticeClear();
                    
                    noticeInsertion();

                    //Sending Mail Here
                    sendMailFinal();
                }
                else{
                    console.log('No further Notice Today');
                    watchTime();
                }
            }

            //see data from database save
            pool.query("SELECT noticetitle FROM aiubnotice",(err,res) => {
                if(err){
                    console.log("Table selecting error which is: "+err);
                }
                else{
                    console.log('Table selecting successfully.');

                    lastNoticeTitle = Object.values(res.rows[0]).toString();

                    console.log('got notice data from database : '+lastNoticeTitle);
                    
                    centralProcessing(lastNoticeTitle);              
                }
            });

            //Have to initialize first when we start the app for the first time
            // pool.query("INSERT INTO aiubnotice (noticetitle) VALUES ('"+noticeTitle+"');",(err,res) => {
            //     if(err){
            //         console.log("Table insertion error which is: "+err);
            //     }
            //     else{
            //         console.log('Table insertion successful.');
            //         console.log('Your inserted notice title is: '+noticeTitle);
            //     }
            // });
    
            browser.close();
        });
    }
    catch(e){
        console.log("Error Catched in configureBrowser(): "+e);
    }
}


// main application starts from here
// cronjob will execute every 1 minute with this: * * * * *
// cronjob will execute every 1 hour with this: 0 * * * *
async function tracking(){
    try{
        let track = new CronJob('0 * * * *', function(){
            console.log('App monitor is running....');
            configureBrowser();
            countCronjobHour++;
            console.log('Total Hour Monitored: '+countCronjobHour);
        }, null, true, null, null, true);
        track.start();
    }
    catch(e){
        console.log("Error Catched in tracking(): "+e);
    }
    
}

//start tracking
tracking();
