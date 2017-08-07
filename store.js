let store = (function(initialData = {}) {

  let subscribers = [];
  let middlewares = [];

  let data = {};

  let generateIdentifier = function(source) {
    if(typeof source === 'function' && source.name) {
      return source.name;
    }
    else if (source.id) {
      return source.id
    }
    else if(source.tagName && source.className) {
      return `${source.tagName}.${source.className.split(' ').join('.')}`;
    }
    return "<no-id>";
  }

  let setData = function(propertyKey, newVal) {
    if(propertyKey === '__HISTORY__') {
      let { source, data: { data : historyData, changed }} = newVal;
      if(source === history) {
        // override values if based from history
        data = historyData;
        if(changed) {
          newVal = { source: changed.source, value: changed.value, source };
          propertyKey = changed.key
        }
      }
    }

    let { source, value, sourceOverride } = newVal;
    source.__id = generateIdentifier(source);
    // no source? setting data directly?
    if(source === undefined) return;

    // set value in history
    history.receive({ data: { ...data }, changed: { key: propertyKey, value, source: sourceOverride || source } });

    // pre-process value from our middleware
    value = middlewares.reduce((val, middleware) => middleware.process && middleware.process(val, propertyKey) || val, value);

    // get existing value
    let { value: oldVal } = data[propertyKey] || {};

    // set the value to data store
    data[propertyKey] = { source, value }

    // set value to subscribers
    subscribers.forEach(o => o.receive({ data: { ...data , source: sourceOverride || source}, changed: { key: propertyKey, value } }))
  }

  let send = function(source, { key, value }) {
    setData(key, { source, value });
  }

  let history = (function() {
    let send = function (data) {
      setData('__HISTORY__', { source: this, data })
    };

    return {
      current: {},
      history: [],
      receive({ data, changed }) {
        let { source } = changed;
        if(source !== this) {
          if(this.current.index !== undefined && this.current.index !== this.history.length - 1) {
            this.history = this.history.slice(0, this.current.index + 1);
          }

          this.history.push(this.current.data = { data: { ...data }, changed: changed })
          this.current.index = this.history.length - 1;
        }
      },
      first() {
        this.current.data = this.history[this.current.index = 0]
        send.call(this, { ...this.current.data })
      },
      last() {
        this.current.data = this.history[this.current.index = this.history.length - 1]
        send.call(this, { ...this.current.data })
      },
      back(step = 1) {
        if(this.current.index === undefined) {
          this.current.index = this.history.length - 1;
        }
        if(this.current.index > 0) {
          this.current.data = this.history[this.current.index = this.current.index - step]
          send.call(this, { ...this.current.data })
        }
      },
      forward(step = 1) {
        if(this.current.index === undefined) {
          this.current.index = this.history.length - 1;
        }
        if(this.current.index < this.history.length - 1) {
          this.current.data = this.history[this.current.index = this.current.index + step]
          send.call(this, { ...this.current.data })
        }
      },
      replay(ms = 200) {
        this.current.index = -1;
        for(let step = 0; step < this.history.length; step++) {
          window.setTimeout(this.forward.bind(this, 1), ms * step)
        }
      }
    }
  })();

  // let proxy = new Proxy(data, {
  //   set: function (target, propertyKey, newVal)  {
  //     if(propertyKey === '__HISTORY__') {
  //       let { source, data: { data : historyData, changed }} = newVal;
  //       if(source === history) {
  //         // override values if based from history
  //         data = historyData;
  //         if(changed) {
  //           newVal = { source: changed.source, value: changed.value, source };
  //           propertyKey = changed.key
  //         }
  //       }
  //     }
  //
  //     let { source, value, sourceOverride } = newVal;
  //     source.__id = generateIdentifier(source);
  //     // no source? setting data directly?
  //     if(source === undefined) return;
  //
  //     // set value in history
  //     history.receive({ data: { ...data }, changed: { key: propertyKey, value, source: sourceOverride || source } });
  //
  //     // pre-process value from our middleware
  //     value = middlewares.reduce((val, middleware) => middleware.process && middleware.process(val, propertyKey) || val, value);
  //
  //     // get existing value
  //     let { value: oldVal } = Reflect.get(data, propertyKey) || {};
  //
  //     // set the value to data store
  //     Reflect.set(data, propertyKey, { source, value })
  //
  //     // set value to subscribers
  //     subscribers.forEach(o => o.receive({ data: { ...data , source: sourceOverride || source}, changed: { key: propertyKey, value } }))
  //   }
  // });



  let store = {
    history,
    get data() {
      return { ...data };
    },
    subscribe(...objs) {
      objs.forEach(obj => {
        obj.send = send.bind(null, obj)
        subscribers.push(obj)
      });
    },
    unsubscribe(obj) {
      delete obj.send;
      subscribers = subscribers.filter(o => obj !== o)
    },
    dispatch(fn) {
      // let { value } = fn()
      send.call(null, fn, fn());
    },
    middleware(...objs) {
      middlewares = middlewares.concat(objs)
    }
  }

  return Object.freeze(store);
})();
