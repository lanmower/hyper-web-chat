window.actions = {
    getProfile(profile) {
        console.log({profile})
        let name = profile?.name;
        if (!name) {
            name = prompt("Display name?");
            this.emit('setProfile', { name });
        }
        this.update({name})
    },
    async getChannels(channels) {
        await this.update({channels, channelName:channels[0].name});
        this.emit('getMessages', channels[0].name);
    },
    getMessages(input) {
        const {messages,channel} = input;
        this.state.messages[channel] = messages;
        console.log(messages, channel, this);
        this.update({messages:this.state.messages});
    },
    message(input) {
        const messages = this.state.messages;
        if(!messages[input.channel]) messages[input.channel] = [];
        console.log({input});
        messages[input.channel].unshift(input);
        this.update({ messages })
    }

}    