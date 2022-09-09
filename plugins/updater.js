const simpleGit = require('simple-git');
const git = simpleGit();
const {bot} = require('../lib');
const Config = require('../config');
const exec = require('child_process').exec;
const Heroku = require('heroku-client');
const { PassThrough } = require('stream');
const heroku = new Heroku({ token: Config.HEROKU.API_KEY })

bot({
    pattern: 'update ?(.*)',
    fromMe: true,
    desc: "Updates bot",
    type: 'owner'
}, (async (message, match) => {
     await git.fetch();
    var commits = await git.log(['master' + '..origin/' + 'master']);
    var mss = '';
    if (commits.total === 0) {
        mss = "*Bot up to date!*"
        return await message.sendMessage(mss);
    } else {
        var changelog = "_Pending updates:_\n\n";
        for (var i in commits.all){
        changelog += `${(parseInt(i)+1)}• *${commits.all[i].message}*\n`
    }
        mss = changelog;
        var buttons = [{buttonId: handler+'updt', buttonText: {displayText: 'START UPDATE'}, type: 1}]
    }

    return await message.sendMessage(mss)   
}));
bot({pattern: 'update now ?(.*)',type: 'owner', fromMe: true, desc: "Updates bot"}, (async (message, match) => {
    await git.fetch();
    var commits = await git.log(['master' + '..origin/' + 'master']);
    if (commits.total === 0) {
        return await message.client.sendMessage(message.jid, { text:"_Bot up to date_"})

    } else {
        await message.sendMessage("_Started update.._")

            try {
                var app = await heroku.get('/apps/' + Config.HEROKU.APP_NAME)
            } catch {
                await message.sendMessage("Heroku information wrong!")

                await new Promise(r => setTimeout(r, 1000));
            }
            git.fetch('upstream', 'master');
            git.reset('hard', ['FETCH_HEAD']);

            var git_url = app.git_url.replace(
                "https://", "https://api:" + Config.HEROKU.API_KEY + "@"
            )
            
            try {
                await git.addRemote('heroku', git_url);
            } catch { console.log('heroku remote ekli'); }
            await git.push('heroku', 'master');

            await message.sendMessage("_Successfully updated_")
           await message.sendMessage("_Restarting_")
            }
}));

