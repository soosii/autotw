const dotenv = require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

const userName = 'qq232306980@qq.com';
const password = 'Hrl853815320';
const keyword = 'CZ';

// 获取当前日期
const currentDate = format(new Date(), 'yyyy-MM-dd');

// 构建文件路径
const filePath = path.join(__dirname+'/log', `${currentDate}.txt`);

//like -- 点赞数量 -- 大于0的时候启动
//keyword和comments -- 根据关键取数据，在特定帖子里面@人  -- 同时有数据任务才启动
// tag -- 根据tag查询推文 -- 根据推文点赞   %23 == #
const accounts = [
  {name:'newman_vic776',password:'Zr0gYS33', proxy: '', like:0, keyword : 'CoinbaseExch', tag:'claim', twitterAddress:'', comments:''},
  {name:'EmersonHar54301',password:'V1mdSu63', proxy: '', like:106, keyword : 'CoinbaseExch', tag:'claim', twitterAddress:'', comments:''},
];

(async () => {
  try {
    for (const account of accounts) {
      const browser = await puppeteer.launch({ headless: false,
        // args: [
        //   '--proxy-server=192.168.1.25:30000',
        // ] ,
        userDataDir: '/path/to/user/data/dir/'+account.name,
      });
      const page = await browser.newPage();


      // add condition to check if user name has been requested
      // review repos
      //create a new branch for the new changes

      await page.goto("https://twitter.com/home");
      await page.waitForTimeout(10000);

      console.log('Login account name1',account.name);
      // 检查用户是否已登录
      const loginButton = await page.$('input[autocomplete="username"]');

      // console.log('loginButton',loginButton);
      if (loginButton) {
        console.log('Login account name2',account.name);
        // await page.goto("https://twitter.com/i/flow/login");
        
        await page.type('input[autocomplete="username"]', account.name, { delay: 100 });

        page.click('div[class="css-18t94o4 css-1dbjc4n r-sdzlij r-1phboty r-rs99b7 r-ywje51 r-usiww2 r-2yi16 r-1qi8awa r-1ny4l3l r-ymttw5 r-o7ynqc r-6416eg r-lrvibr r-13qz1uu"]');

        
        await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 50000 });

        await page.type('input[autocomplete="current-password"]', account.password, { delay: 100 });
        
        await Promise.all([
          page.click('div[class="css-18t94o4 css-1dbjc4n r-sdzlij r-1phboty r-rs99b7 r-19yznuf r-64el8z r-1ny4l3l r-1dye5f7 r-o7ynqc r-6416eg r-lrvibr"]'),
          page.waitForNavigation(),
        ]);
        await page.waitForSelector('div[data-testid="SideNav_AccountSwitcher_Button"]', { timeout: 30000 });
        const isLoggedIn = await page.evaluate(() => {
          return document.querySelector('div[data-testid="SideNav_AccountSwitcher_Button"]') !== null;
        });
        if (isLoggedIn) {
          console.log('Login successful!');
        } else {
          console.log('Login failed!');
        }
      }


      
      

      if(account.like > 0 && account.tag){

        if(account.tag){
          await page.goto(`https://twitter.com/search?q=%23${account.tag}&src=typed_query`);
        }
        const faileCount = 0;
        await page.waitForTimeout(5000);
        for (let i = 0; i < 1000&& account.like >0 ; i++) {

          // 获取当前页面的 URL
          const currentUrl = await page.evaluate(() => window.location.search);

          // 创建 URLSearchParams 对象并解析 URL
          const urlParams = new URLSearchParams(currentUrl);

          // 获取指定参数的值
          const paramValueF = urlParams.get('f');

          if (paramValueF) {
            await page.goto(`https://twitter.com/search?q=%23${account.tag}&src=typed_query`);
            console.log('currentUrl-----'+currentUrl,'paramValueF----'+paramValueF);
            continue;
          }

          const paramValueQ = urlParams.get('q');
          if(!paramValueQ){
            await page.goto(`https://twitter.com/search?q=%23${account.tag}&src=typed_query`);
            console.log('currentUrl-----'+currentUrl,'paramValueQ----'+paramValueQ);
            continue;
          }
          
          if(faileCount>10){
            await page.goto(`https://twitter.com/search?q=%23${account.tag}&src=typed_query`);
            console.log('faileCount-----');
            faileCount = 0;
            continue;
          }

          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight*2);
          });
          await page.waitForTimeout(2000);
          // 获取所有未点赞推文的属性值
          const likes = await page.$$('div[data-testid="like"]');

          // 随机选择一个未点赞推文进行点赞
          const randomIndex = Math.floor(Math.random() * likes.length);
          console.log('未点赞推文数量：'+likes.length,'  当前滚动次数：'+i);
          if(likes.length>0){
            const tweetToLike = await page.$$('div[data-testid="like"]');
            // 设置点击概率为75%
            const clickProbability = 0.75;

            // 生成一个0到1之间的随机数
            const random = Math.random();

            // 判断是否进行点击操作
            if (random < clickProbability) {
              await tweetToLike[randomIndex].click();
              account.like--;
              console.log('已点赞推文  剩余:'+account.like);
            }
          }else{
            faileCount++;
          }
          let errorMessage = `[${new Date().toISOString()}] 点赞任务 --- 用户:${account.name} \n 剩下:${account.like}\n`;

          // 将错误信息写入文件
          fs.appendFileSync(filePath, errorMessage, 'utf8');

          const time = Math.random()*3000;
          await page.waitForTimeout(time);
        }
      }

      //@用户 帖子
      //关键查询->获取非认证的用户
      if(account.keyword && account.twitterAddress){

        let commenterNames = [];//@人
        let count = 12 ;//数量

        // await page.goto('https://twitter.com/explore');
        // await page.waitForTimeout(5000);
        
        // // // 点击进入“探索”页面
        // // await page.waitForSelector('nav[data-testidaria-label="主要"] a[data-testid="AppTabBar_Explore_Link"]');
        // // await page.click('nav[data-testid="primaryColumn"] a[data-testid="AppTabBar_Explore_Link"]');
        // // await page.waitForNavigation();

        // // 在“探索”页面输入关键字
        // await page.waitForSelector('input[data-testid="SearchBox_Search_Input"]');
        // // await page.type('input[data-testid="SearchBox_Search_Input"]', account.keyword, { delay: 100 });
        // await page.waitForTimeout(3000);
        // await page.keyboard.press('Enter');
        // // await page.waitForNavigation();

        await page.goto(`https://twitter.com/search?q=${account.keyword}&src=typed_query&f=user`);

        // 等待页面加载完成
        await page.waitForSelector('div[data-testid="UserCell"]');

        // 查找第一个相关用户
        const users = await page.$$('div[data-testid="UserCell"]');
        const firstUser = users[0];
        const username = await firstUser.$eval('div[class="css-901oao r-1awozwy r-18jsvk2 r-6koalj r-37j5jr r-a023e6 r-b88u0q r-rjixqe r-bcqeeo r-1udh08x r-3s2u2q r-qvutc0"] span[class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0"]', el => el.textContent);
        console.log(`First user: ${username}`);

        // // 进入该用户的页面
        await firstUser.click();
        await page.waitForTimeout(5000);

        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });

        await page.waitForTimeout(3000);

        // // 查找置顶帖
        // 等待置顶推文加载完成
        await page.waitForSelector('article[data-testid="tweet"]:nth-child(1)');

        // 点击置顶推文，进入推文页面
        // await page.click('article[data-testid="tweet"]:nth-child(1)');
        // 使用 page.evaluate 方法点击置顶推文
        await page.evaluate(() => {
          const tweetElement = document.querySelector('article[data-testid="tweet"]:nth-child(1)');
          if (tweetElement) {
            tweetElement.click();
          }
        });

        await page.waitForTimeout(3000);

        

        
        // 向下滚动4次
        for (let i = 0; i < 100&& count >0 ; i++) {
          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
          });
          await page.waitForTimeout(2000); // 等待滚动加载内容

          const comments = await page.$$('article[data-testid="tweet"]');

          console.log(`comments content: ${comments.length}`);
          for (let j = 0; j < 50 && j < comments.length; j++) {
            const comment = comments[j];
            
            // const isVerified = await comment.$('svg[aria-label="认证账号"]');
            const isVerified = await comment.$('svg[aria-label="Verified account"]');
            // console.log(`认证账号 : ${comments.length} ${isVerified}`);
            if (isVerified) {
              continue; // 跳过认证用户
            }
            const commenterName = await comment.$eval('div[class="css-1dbjc4n r-18u37iz r-1wbh5a2 r-13hce6t"] div[class="css-1dbjc4n r-1wbh5a2 r-dnmrzs"] span', el => el.textContent);
            
            if(!commenterNames.includes(commenterName)){
              console.log(`评论人名称：${commenterName}`);
              commenterNames.push(commenterName)
              count--;
            }
          }
        }

        if(commenterNames.length > 0){
          await page.goto(account.twitterAddress);
      
          // console.log(`tweetToReply ${tweetToReply.length}`);
          await page.waitForSelector('div[aria-label="Reply"]');
          // 点击回复按钮，打开回复框
          await page.click('div[aria-label="Reply"]');

          // 等待回复框加载完成
          await page.waitForSelector('div[data-testid="tweetTextarea_0"]');
          
          // 使用逗号分隔符将数组转换为字符串
          let commenterStr = commenterNames.join(' ');
          console.log(`commenterStr ${account.comments}`);
          let commenterAll = `${commenterStr +' ' + account.comments}`;

          await page.type('div[data-testid="tweetTextarea_0"]', commenterAll);


          // 提交回复
          await page.click('div[data-testid="tweetButton"]');

          let errorMessage = `[${new Date().toISOString()}] 回复任务 --- 用户:${account.name} \n 内容:${commenterAll}\n`;

          // 将错误信息写入文件
          fs.appendFileSync(filePath, errorMessage, 'utf8');
          
        }
      }


      
      
      
    }
    // const tweetText = await firstTweet.$eval('div[lang] ', el => el.textContent);
    // console.log(`Sticky tweet text: ${tweetText}`);

    // 关闭浏览器
    // await browser.close();

  } catch (error) {
    console.error(error);
    // 捕获错误

    // 构建错误信息
    let errorMessage = `[${new Date().toISOString()}] 错误信息 --- ${error.stack}\n`;

    // 将错误信息写入文件
    fs.appendFileSync(filePath, errorMessage, 'utf8');

    console.log(`错误信息已写入文件：${filePath}`);
  } finally {
    
  }
})();
