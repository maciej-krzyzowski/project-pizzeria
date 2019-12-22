import {Product} from './components/Product.js';
import {Cart} from './components/Cart.js';
import {Booking} from './components/Booking.js';
import {select, settings, classNames} from './settings.js';


const app = {
    initMenu: function() {
        const thisApp = this;

        for(let productData in thisApp.data.products) {
            new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
        }
    },

    initData: function() {
        const thisApp = this;

        thisApp.data = {};
        const url = settings.db.url + '/' + settings.db.product;

        fetch(url)
            .then(function(rawResponse){
                return rawResponse.json();
            })
            .then(function(parsedResponse){
                thisApp.data.products = parsedResponse;
                thisApp.initMenu();
            });
    },

    initCart: function() {
        const thisApp = this;

        const cartElem = document.querySelector(select.containerOf.cart);
        thisApp.cart = new Cart(cartElem);

        thisApp.productList = document.querySelector(select.containerOf.menu);

        thisApp.productList.addEventListener('add-to-cart', function(event){
            app.cart.add(event.detail.product);
        });
    },

    initPages: function() {
        const thisApp = this;

        thisApp.pages = Array.from(document.querySelector(select.containerOf.pages).children);
        thisApp.navLinks = Array.from(document.querySelectorAll(select.nav.links));

        thisApp.activatePage(thisApp.checkCurrentPage());

        for(let link of thisApp.navLinks) {
            link.addEventListener('click', function(event) {
                const clickedElement = this;
                event.preventDefault();
                const pageId = clickedElement.getAttribute('href').replace('#', '');
                thisApp.activatePage(pageId);
            });
        }
    },

    checkCurrentPage() {
        return window.location.hash.replace('#', '');
    },

    activatePage: function(pageId) {
        const thisApp = this;

        for(let link of thisApp.navLinks) {
            link.classList.toggle(classNames.nav.active, link.getAttribute('href') == '#' + pageId);
        }

        for(let page of thisApp.pages) {
            page.classList.toggle(classNames.nav.active, page.getAttribute('id') == pageId);
        }

        window.location.hash = '#' + pageId;
    },

    initBooking: function() {
        const thisApp = this;

        const wrapperBooking = document.querySelector(select.containerOf.booking);
        thisApp.booking = new Booking(wrapperBooking);
    },

    init: function() {
        const thisApp = this;

        // console.log('*** App starting ***');
        // console.log('thisApp:', thisApp);
        // console.log('classNames:', classNames);
        // console.log('settings:', settings);
        // console.log('templates:', templates);

        thisApp.initPages();
        thisApp.initData();
        thisApp.initCart();
        thisApp.initBooking();
    },
};

app.init();
