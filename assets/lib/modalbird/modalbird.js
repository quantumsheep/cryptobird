class ModalBird {
    static init() {
        this.isOpen = false;

        document.querySelectorAll('.modalbird[data-modal]').forEach(modal => {
            modal.style.paddingRight = this.getScrollbarWidth() + 'px';

            modal.querySelectorAll('[data-action=close]').forEach(closebtn => {
                closebtn.addEventListener('click', e => {
                    e.preventDefault();
                    this.hide(modal.getAttribute('data-modal'));
                });
            });

            modal.addEventListener('click', e => {
                if (e.target == modal) {
                    this.hide(modal.getAttribute('data-modal'));
                }
            });
        });
    }

    static hide(modal) {
        document.querySelectorAll(`.modalbird[data-modal=${modal}]`).forEach(modal => {
            modal.classList.add('hide');
            this.isOpen = false;

            setTimeout(() => {
                if(this.isOpen) {
                    document.body.style.paddingRight = null;
                    document.body.classList.remove('modalbird-isopen');
                }
            }, 300);
        });
    }

    static show(modal) {
        this.isOpen = true;
        document.body.classList.add('modalbird-isopen');
        document.body.style.paddingRight = this.getScrollbarWidth() + 'px';

        document.querySelectorAll(`.modalbird[data-modal=${modal}]`).forEach(modal => {
            modal.scrollTop = 0;
            modal.classList.remove('hide');
        });
    }

    static getScrollbarWidth() {
        const outer = document.createElement("div");
        outer.style.visibility = "hidden";
        outer.style.width = "100px";
        outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

        document.body.appendChild(outer);

        const widthNoScroll = outer.offsetWidth;
        outer.style.overflow = "scroll";

        const inner = document.createElement("div");
        inner.style.width = "100%";
        outer.appendChild(inner);

        const widthWithScroll = inner.offsetWidth;

        outer.parentNode.removeChild(outer);

        return widthNoScroll - widthWithScroll;
    }
}