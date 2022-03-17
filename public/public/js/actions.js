window.hooks = {
    
}


window.actions = {
    getProfile(profile) {
        let name = profile?.name;
        if (!name) {
            name = prompt("Display name?");
            this.emit('setProfile', { name });
        }
        this.update({name})
    },
    async findRole(roles) {
        await this.update({roles});
    },
    refresh() {
        window.location.reload();
    },
    async findProfile(profiles) {
        console.log('FOUND PROFLES',{profiles});
        await this.update({profiles:Object.values(profiles)});
    },
    message(input) {
        const messages = this.state.messages;
        if(!messages[input.channel.id]) messages[input.channel.id] = [];
        messages[input.channel.id].push(input);
        this.update({ messages })
    },

}    
