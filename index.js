const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
require('dotenv').config();

const aiubNoticeURL = 'https://www.aiub.edu/';

var noticeTitle, postURL, day, month, year;
var lastNoticeTitle;
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

        //Current Time Calculation
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
    
        page.waitForSelector("#notice > div:nth-child(1)").then(async function(){
            noticeTitle = await page.$eval("#notice > div:nth-child(1) > a", element => element.innerHTML);
            day = await page.$eval("#notice > div:nth-child(1) > div > span", element => element.innerHTML);
            month = monthArray[cmonth];
            year = cyear.toString();
            postURL = await page.$$eval('#notice > div:nth-child(1) > a', e=>e.map((a)=>a.href))

            
            
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
                text: `${noticeTitle}\n\nNotice Date: ${day} ${month},${year}\n\nSee full notice: ${postURL}`
                // attachment:
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
            if(lastNoticeTitle != noticeTitle){

                lastNoticeTitle = noticeTitle;

                console.log(`${day} ${month},${year}`);
                console.log(noticeTitle);
                console.log("See full post: "+postURL);
                watchTime();

                //Sending Mail Here
                //sendMailFinal();
            }
            else{
                console.log('No further Notice Today');
                watchTime();
            }
            browser.close();
        });
    }
    catch(e){
        console.log("Error Catched in configureBrowser(): "+e);
    }
}


// main application starts from here
// cronjob will execute every 1 hour with this: 0 * * * *
async function tracking(){
    try{
        let track = new CronJob('0 * * * *', function(){
            configureBrowser();
            console.log('App monitor is running....');
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
