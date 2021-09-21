window.actions = {
    getProfile(profile) {
        console.log({profile}, this)
        let name = profile?.name;
        if (!name) {
            name = prompt("Display name?");
            this.emit('setProfile', { name });
        }
        this.update({name})
    },
    async getChannels(channels) {
        const channelId = Object.keys(channels)[0];
        await this.update({channels, channelId});
        this.emit('getMessages', channelId); 
    },
    async getRoles(roles) {
        await this.update({roles});
    },
    getMessages(input) {
        console.log({input})
        const {messages,channelId} = input;
        this.state.messages[channelId] = messages;
        this.update({messages:this.state.messages, channelId});
    },
    message(input) {
        console.log({input});
        const messages = this.state.messages;
        if(!messages[input.channel.id]) messages[input.channel.id] = [];
        messages[input.channel.id].unshift(input);
        this.update({ messages })
    },

}    