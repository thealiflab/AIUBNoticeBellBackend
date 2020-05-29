const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
require('dotenv').config();

const aiubNoticeURL = 'https://www.aiub.edu/category/notices';

var noticeTitle, noticeDesc, postURL, day, month, year;
var lastNoticeTitle;
var dateObj, cday, cmonth, cyear; //for current date
const monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var countCronjobHour = -1;

// var port = process.env.PORT || 5000;

var server_port = process.env.PORT || 80;
var server_host = '0.0.0.0';
server.listen(server_port, server_host, function() {
    console.log('Listening on port: ' + server_port);
});


//puppeteer
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
            var dateObj = new Date();
            var cday = dateObj.getUTCDate();
            var cmonth = dateObj.getUTCMonth(); //months from 1-12
            var cyear = dateObj.getUTCFullYear();


            //nodemailer
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
                text: `${noticeTitle}\n\n${noticeDesc}\n\nDate: ${day} ${month},${year}\n\nSee full notice: ${postURL}`

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
            

    
            //checking todays date instead of "22 May, 2020"
            if(day == cday.toString() && month == monthArray[cmonth] && year == cyear.toString() && lastNoticeTitle != noticeTitle){

                console.log(`${day} ${month},${year}`);
                console.log(noticeTitle);
                console.log(noticeDesc);
                console.log("See full post: "+postURL);

                sendMailFinal();
                lastNoticeTitle = noticeTitle;
            }
            else{
                console.log('No further Notice Today');
            }
            browser.close();
        });
    }
    catch(e){
        console.log("Error Catched in configureBrowser(): "+e);
    }
}

// cronjob will execute every 1 hour with this: 0 * * * *
async function tracking(){
    try{
        let track = new CronJob('0 * * * *', function(){
            configureBrowser();
            console.log('Cronjob is running....');
            countCronjobHour++;
            console.log('Total Hour Monitored: '+countCronjobHour);
        }, null, true, null, null, true);
        track.start();
    }
    catch(e){
        console.log("Error Catched in tracking(): "+e);
    }
    
}

// //start tracking
tracking();
