# gulp_start_datoshcode
The assembly speeds up the website development process.
--- About "gulp_start_datoshcode" ---

This is a custom build of the Gulp task manager that speeds up the website development process.

Author: Andrii Ovcharov (Datosh Code);
Build date: 16.10.2023
E-mail: datoshcode@gmail.com
Licence: GNU/GPL.


--- Assembly capabilities ---

1. Compresses and converts style files from format .scss to format .min.css;
2. Compresses JS script files;
3. The site is built in real time on the fly;
4. Adding vendor prefixes to the styles file;
5. Converts images from .jpg, .png to .webp, .avif;
6. The final build is performed with the previous cleanup of obsolete files.


--- Instructions for using the tool --- 

1. To start working with the website assembly tool, you need to copy all the files into an empty folder of the new project : 
npm i

2. After this, to start developing the website, you need to enter the command in the terminal:
gulp

3. After completing development and to perform operations to compress and convert project files, you must enter the final command:
gulp build

4. To stop the build process, press the key combination: 'Ctrl+C'.

5. Individual components of HTML pages must be saved in the folder "components", and the main part of the code for HTML must be written in the index.html file in the folder "pages". Other HTML project files must also be saved in the "pages" folder. The finished version of the HTML layout file will be saved in the root "app" folder.
