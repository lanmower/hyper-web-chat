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
        console.log(channels);
        await this.update({channels, channelId});
        this.emit('getMessages', channelId); 
    },
    async getRoles(roles) {
        await this.update({roles});
    },
    refresh() {

        console.log('refresh')
        window.location.reload();
    },
    getMessages(input) {
        console.log("MESSAGES", {input})
        const {messages,channelId} = input;
        this.state.messages[channelId] = Object.values(messages);
        this.update({messages:this.state.messages, channelId});
    },
    async getProfiles(profiles) {
        await this.update({profiles:Object.values(profiles)});
    },
    message(input) {
        const messages = this.state.messages;
        if(!messages[input.channel.id]) messages[input.channel.id] = [];
        messages[input.channel.id].push(input);
        this.update({ messages })
    },

}    