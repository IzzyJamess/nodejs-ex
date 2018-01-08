const Discord = require("discord.js");
const config = require("./config.json");
const fs = require('fs-extra');
const axios = require('axios');
var TwitchAPI = require("twitch-helix-api");

TwitchAPI.clientID = config.twitch.clientId;

var streamers;
var string_streamers;

var community_id;

var streamersCurrentlyStreaming = [
    //streamers en stream
]

var OnStream;
//Connect to discord server
const client = new Discord.Client();
client.login(config.token);

client.on('ready', () => {
    console.log('Bot connected to discord');
    client.user.setGame("troller les modos");
});

//Moderate twitch.tv link
client.on('message', (message) => {
    let regex = new RegExp("twitch.tv");
    
    if(regex.test(message)) {
        message.delete(0);
        message.reply(config.messages.moderate);
        console.log('le message de ' + message.author.username + ' a été supprimé');
    };
});

    //role En Stream
client.on('presenceUpdate', (x, member) => {

    var client_id = client.user.id;
    var SPS = client.guilds.array();
    SPS = SPS[0];
    var BotMember = SPS.members.find('id', client_id);

    if(BotMember.roles.find('name', 'En stream')){
        axios
            .get('https://api.twitch.tv/kraken/streams/petitsstreamstv', {headers: {'Client-ID': config.twitch.clientId }})
            .then(function(response){
                if(response != null) {
                    BotMember.addRole(OnStream);
                    console.log('La PSTV est en stream');
                }
                else {
                    BotMember.removeRole(OnStream);
                }
            })
    };
    let memberId = 'id_'+member.id;
    
    if (member.roles.find('name', 'En stream')){
        console.log(member.displayName + " n'est plus en stream");
        streamersCurrentlyStreaming = streamersCurrentlyStreaming.filter((id) => id !== memberId);
        member.removeRole(OnStream);
    };

    if(member.user.presence) {
        var presence = member.user.presence;
    
        if (member.user.presence.game){
            var theGame = member.user.presence.game;
        
            if(member.user.presence.game.streaming) {
                var isInStreaming = member.user.presence.game.streaming;
            }
        }
    };

    //Player begin to stream, member can be not playing atm
    if(theGame) {
        if (isInStreaming) {
            if(streamerIsStreaming(memberId) != null){
                 return;
            }

            //check if user has twitch channel
            
            if(RegExp(memberId).test(string_streamers)) {

                var memberChannel = eval('streamers.' + memberId);
                if(member.roles.find(member.guild.roles.find('name', 'communauté twitch'))) {
                    if(memberChannel) {

                    //chheck if is really streaming on twitch
                        axios   
                            .get('https://api.twitch.tv/kraken/streams/' +memberChannel, { headers: { 'Client-ID': config.twitch.clientId } })
                            .then(function(response){
                                console.log('response: '+response);
                                if (response != null){
                                    //if (response.data.community_ids){
                                        //if (response.data.community_ids.indexOf(community_id) >= 0){
                                
                                            member.addRole(OnStream);
                                            streamersCurrentlyStreaming.push(memberId);
                                            console.log(member.displayName + ' est en stream');
                                        //}
                                    //}
                                }
                            });
                    }
                }
            }
        }

        else{ 
             if (member.roles.find('name', 'En stream')){
                console.log(member.displayName + " n'est plus en stream");
                streamersCurrentlyStreaming = streamersCurrentlyStreaming.filter((id) => id !== memberId);
                member.removeRole(OnStream);
            };
        }

    }
    
    //check if userschannel is not anymore in stream    
    else{ 
         if (member.roles.find('name', 'En stream')){
            console.log(member.displayName + " n'est plus en stream");
            streamersCurrentlyStreaming = streamersCurrentlyStreaming.filter((id) => id !== memberId);
            member.removeRole(OnStream);
        };
}});  


client.on("guildMemberAdd", (member) => {
    member.createDM().then(channel => {
        fs.readFile('./welcome.txt', function(err, data) {
            channel.send(data.toString());
            console.log(member.displayName + ' a rejoint le serveur');
        })
    }).catch(console.log.bind(console));

})


client.on('message', (message) => {
    if (message.toString().substring(0, 1) == '!') {
        var args = message.toString().substring(1).split(' ');
        var cmd = args[0];

        if(cmd === 'twitch'){
            
                var authID = "id_"+message.author.id;
            
                if (args[1]){
                    var TwitchChannel = args[1].toString();
                    var profile = ', "'+String(authID)+'" : "'+String(TwitchChannel)+'"}';
                
                    fs.readFile('./streamers.txt', 'UTF-8' , function(err, data) {
                        if (err) {console.log(err)};
                        if (RegExp(profile).test(data)){
                            return;
                        }

                        data = data.replace('}', profile);
                        fs.writeFile('./streamers.txt', data);
                        string_streamers = data;
                        streamers = JSON.parse(data);
                        console.log(message.author.username + ' a été ajouté');
                        OnStream = message.guild.roles.find('name', 'En stream');
                        message.reply(config.messages.successful_entry);
                    });
                }
        
        }   
    }
});

function streamerIsStreaming(id) {
    if(streamersCurrentlyStreaming.indexOf(id) >= 0) {
       return streamersCurrentlyStreaming.indexOf(id);
    } else {
        return null;
    }
};