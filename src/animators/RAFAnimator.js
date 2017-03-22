const _startUpdates = Symbol('startUpdates');
const _tickUpdate = Symbol('tickUpdate');

function setProperty(object, type, val) {
  switch (type) {
    case 'opacity':
      object.style.opacity = val;
      break;
  }
}

function retrieveProperty(object, type) {
  switch (type) {
    case 'opacity':
      return object.style.opacity;
      break;
  }
}

class RAFAnimator {
  constructor(options) {
    this.updateItems = [];
    this.isUpdating = false;

    this[_startUpdates] = () => {
      if (!this.isUpdating) {
        console.log('Starting Tweens');
        window.requestAnimationFrame(this[_tickUpdate]);
        this.isUpdating = true;
      }
    };
    this[_tickUpdate] = (time) => {
      let stillMoreTweens = false;

      this.updateItems.forEach(updateItem => {
        let stillMoreProperties = false;

        updateItem.properties.forEach(tween => {
          // timing
          if (!tween.startTime) {
            tween.startTime = time + tween.delay;
          }
          const percProgress = Math.max(0.0, Math.min(1.0, (time - tween.startTime) / tween.duration));

          // update
          if (percProgress > 0.0) {
            const val = tween.easing
              ? tween.from + (tween.easing(percProgress) * (tween.to - tween.from))
              : tween.from + (percProgress * (tween.to - tween.from));

            setProperty(updateItem.object, tween.type, val);
          }

          // check if complete
          if (percProgress < 1.0) {
            stillMoreTweens = true;
            stillMoreProperties = true;
          } else {
            updateItem.properties.splice(updateItem.properties.indexOf(tween), 1);
            if (typeof tween.onComplete === 'function') {
              tween.onComplete.apply(tween, tween.onCompleteParams);
            }

          }
        });

        if (!stillMoreProperties) {
          this.updateItems.splice(this.updateItems.indexOf(updateItem), 1);
        }
      });

      // check if need to continue
      if (stillMoreTweens) {
        window.requestAnimationFrame(this[_tickUpdate]);
      } else {
        this.isUpdating = false;
        console.log('Done with tweening');
      }
    };
  }

  tween(options) {
    // get updateItem for given object
    let updateItem;
    this.updateItems.forEach((item) => {
      if (item.object === options.object) {
        updateItem = item;
      }
    });
    if (!updateItem) {
      updateItem = {
        object: options.object,
        properties: [],
      };
      this.updateItems.push(updateItem);
    }

    // add property entry for each key in options.to
    for (let prop in options.to) {
      if (options.to.hasOwnProperty(prop)) {
        updateItem.properties.push({
          type: prop,
          from: options.from[prop] || retrieveProperty(updateItem.object, prop),
          to: options.to[prop],
          duration: options.duration || 1000,
          delay: options.delay || 0,
          easing: options.easing,
          onComplete: options.onComplete,
          onCompleteParams: options.onCompleteParams,
        });

        // oncomplete only gets applied to the first
        options.onComplete = undefined;
        options.onCompleteParams = undefined;

        // initial tick
        if (options.from[prop]) {
          setProperty(updateItem.object, prop, options.from[prop]);
        }
      }
    }

    this[_startUpdates]();
  }
}

export default new RAFAnimator();
