const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
require('dotenv').config();

const aiubNoticeURL = 'https://www.aiub.edu/category/notices';

var noticeTitle, noticeDesc, postURL, day, month, year;
var lastNotice;

//puppeteer

async function configureBrowser(){
    try{
        const browser = await puppeteer.launch({
            headless: true
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


            //nodemailer
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth:{
                    user: process.env.EMAIL,
                    pass: process.env.PASS
                }
            });

            var mailOptions = {
                from: 'AIUB Notice Bell <donationdistributation@gmail.com>',
                to: 'geekalif@gmail.com',
                subject: 'New Notice',
                text: `${noticeTitle}\n\n${noticeDesc}\n\n${day} ${month},${year}\n\nSee full notice: ${postURL}`

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
            
    
            //checking todays date instead of "22"

            if(day == "22" && lastNotice != noticeTitle){

                console.log(`${day} ${month},${year}`);
                console.log(noticeTitle);
                console.log(noticeDesc);
                console.log("See full post: "+postURL);

                sendMailFinal();
                lastNotice = noticeTitle;
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

// configureBrowser();

// cronjob will execute every 1 hour with this: 0 * * * *
async function tracking(){
    try{
        let track = new CronJob('0 * * * *', function(){
            configureBrowser();
            console.log('Cronjob is running....');
        }, null, true, null, null, true);
        track.start();
    }
    catch(e){
        console.log("Error Catched in tracking(): "+e);
    }
    
}

// //start tracking
tracking();


