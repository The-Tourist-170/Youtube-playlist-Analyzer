const { log } = require('console');
const puppeteer = require('puppeteer'),
      pdf = require('pdfkit'),
      fs = require('fs');

let cTab,
    link = "https://youtube.com/playlist?list=PLRBp0Fe2GpgnK6tqqlVDbmTqQTF-6rrRj";

(async function(){
    try {
        const bOpen = puppeteer.launch({
            headless : false,
            defaultViewport : null,
            args : ['--start-maximized']
        })

        const bInst = await bOpen;
        const tArr = await bInst.pages();
        cTab = tArr[0];
        await cTab.goto(link);
        await cTab.waitForSelector('#text');
        const name = await cTab.evaluate(
            function(sel){
                return document.querySelector(sel).innerText
            }, '#text');
        const data = await cTab.evaluate(getData, '.byline-item.style-scope.ytd-playlist-byline-renderer');
        console.log(`Analyzing ${name}, from Youtube.`);
        console.log(`Total Number of Videos in the Playlist are ${data.vid}.`);
        console.log(`Total Views on the playlist are ${data.views}.`);
        const tVid = data.vid.split(" ")[0];
        let len = await getCurVidLen();
        //console.log(tVid, len);

        while(tVid - len >= 0){
            await scr2bot();
            len = await getCurVidLen();
            //console.log(len);
        }

        const infoArr = await fetchInfo();
        console.log('Playlist Loaded.');

        const pdfObject = new pdf;
        const pdfName = 'PlaylistAnalyze.pdf';    
        pdfObject.pipe(fs.createWriteStream(pdfName));
        
        for(let i = 0; i < infoArr.length; i++){
            const data = infoArr[i];
            pdfObject.text(JSON.stringify(i+1));
            pdfObject.text(JSON.stringify(`Title: ${data["Title"]}`));
            pdfObject.text(JSON.stringify(`Duration: ${data["Duration"]}`));
            pdfObject.text(JSON.stringify(`Views: ${data["Views"]}`));            
        }

        pdfObject.end();
        console.log(`A PDF file with name ${pdfName} has been created with the information analyzed.`);
        console.log("END OF PROGRAM.......");

    } catch (error) {
        console.log(error);
    }
})()

function getData(sel){
    const data = document.querySelectorAll(sel);
    const vid = data[0].innerText,
          views = data[1].innerText;

    return{
        vid,
        views
    };
}

async function getCurVidLen(){
    const len = await cTab.evaluate(getLen, '#contents .style-scope.ytd-playlist-video-list-renderer.style-scope.ytd-playlist-video-list-renderer');
    return len;
}

function getLen(sel){
    return document.querySelectorAll(sel).length;
}

async function fetchInfo(){
    const list = await getStats();
    let infoArr = [];
    for(let i = 4; i < list.length - 1; i++){
        const Title = list[i][3];
        const Duration = list[i][1];
        const Views = list[i][6];
        infoArr.push({
            Title, Duration, Views
        });
    }

    return infoArr;
}

async function scr2bot(){
    await cTab.evaluate(goToBot);
    function goToBot(){
        window.scrollBy(0, window.innerHeight);
    }
}

async function getStats(){
    const list = await cTab.evaluate(getInfo, '.style-scope.ytd-playlist-video-list-renderer');
    return list;
}

function getInfo(sel){
    const ele = document.querySelectorAll(sel);
    let dataArr = [];

    for(let i = 0; i < ele.length; i++){
        const info = ele[i].innerText.split("\n");
        dataArr.push(info);
    }

    return dataArr;
}