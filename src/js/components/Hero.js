import {classNames} from '../settings.js';

export class Hero {
    constructor() {
        const thisHero = this;

        thisHero.getElements();
        setInterval(function(){
            thisHero.caruselHome();
        }, 3000);
    }

    getElements() {
        const thisHero = this;

        thisHero.caruselWrapper = Array.from(document.querySelectorAll('.revies'));
        thisHero.dots = document.querySelectorAll('.dot');
        thisHero.i = 0;
    }

    toggleClass() {
        const thisHero = this; 

        for(let wrapper of thisHero.caruselWrapper){
            wrapper.classList.remove(classNames.carusel.wrapperActive);
        }
        for(let dot of thisHero.dots){
            dot.classList.remove('dot-active');
        }
        thisHero.caruselWrapper[thisHero.i].classList.add(classNames.carusel.wrapperActive);
        thisHero.dots[thisHero.i].classList.add('dot-active');
    }
    
    caruselHome() {
        const thisHero = this;
        
        if(thisHero.i == 0) {
            thisHero.toggleClass();
            thisHero.i = 1;
        } else if (thisHero.i == 1) {
            thisHero.toggleClass();
            thisHero.i = 2;
        } else if (thisHero.i == 2) {
            thisHero.toggleClass();
            thisHero.i = 0;
        }
    }
}