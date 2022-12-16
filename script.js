/*   TODO
 * - LIGHT + DARKMODE 
 * - SEARCH ENGINE 
 * - CHANE FAVICONS TO REPRESENT THEME 
 * - CREATE DARK VARIANT OF VECTOR 
 * - SCROLL ANIMATION 
 */

//---------------[ LIGHT / DARK MODE ]---------------{{{


//---}}}---

//----------------[ SCROLL ANIMATION ]----------------{{{ 

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        console.log(entry)
        entry.target.classList.toggle('shown', entry.isIntersecting);
    });
});

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));

//---}}}---
