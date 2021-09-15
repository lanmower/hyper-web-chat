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
        console.log('channels', channels, this)
        await this.update({channels, channelName:channels[0].name});
        this.emit('getMessages', channels[0].name);
    },
    getMessages(input) {
        console.log('messages', input, this)
        const {messages,channel} = input;
        this.state.messages[channel] = messages;
        console.log(messages, channel, this);
        this.update({messages:this.state.messages, channelName:channel});
    },
    message(input) {
        console.log('message', input)
        const messages = this.state.messages;
        if(!messages[input.channel]) messages[input.channel] = [];
        console.log({input});
        messages[input.channel].unshift(input);
        this.update({ messages })
    }

}    