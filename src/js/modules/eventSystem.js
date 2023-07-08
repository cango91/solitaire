/** Singleton
 * 
 * EventSystem is used to decouple game-logic from DOM manipulation. 
 * Commands should notify the event system by triggering relevant events.
 * DOM manipulators should add listeners for their relevant events, perform DOM manipulation then callback. 
 * Commands should use Promises to ensure DOM manipulation is complete before proceeding (i.e. provide their resolve as callback when triggering events).
 */ 
class EventSystem {
    constructor() {
        if (EventSystem.instance) {
            return EventSystem.instance;
        }
        this.listeners = {};
        EventSystem.instance = this;
    }

    listen(eventName, callback) {
        if (!this.listeners[eventName])
            this.listeners[eventName] = [];
        this.listeners[eventName].push(callback);
    }

    trigger(eventName, eventData) {
        if (this.listeners[eventName])
            for (let callback of this.listeners[eventName]) {
                callback(eventData);
            }
        else if(eventData.hasOwnProperty('callback')){
            console.log(`No listeners for ${eventName}, invoking callback`);
            eventData.callback();
        }
    }
    remove(eventName,cb){
        if(this.listeners[eventName])
        try{
            this.listeners[eventName] = this.listeners[eventName].splice(this.listeners[eventName].findIndex((c)=>c===cb),1);
        }catch (e){
            console.log(e);
        }
    }
    
}

const eventSystem = new EventSystem();
export default eventSystem;