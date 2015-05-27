jQuery SimpleFilePreview
----

SimpleFilePreview is a jQuery plug-in that allows for pre-form submission 
file previews on images and icon previews for non-images. The syntax is extremely
simple and the UI allows for easy CSS styling.
  
**Requires: jQuery 1.9.1+**
**Requires: Bootstrap 3.3.4+ (for progressbar only)**

### Main Features

* Simple to implement
* Show pre-submit image file preview in browsers that support this functionality
* Show image file previews for any file post-upload
* Show icon previews for any file type in all browsers
* Works on "multiple" file inputs as well as single file inputs
* Completely stylable
* Small footprint

### Options

```text
'buttonContent': STRING      HTML content for the button to add a new file
                            (defaults to "Add File")
'removeContent': STRING     HTML content for the removal icon shown on hover when a file is 
                            selected (or for existing files) 
                            (defaults to "X")
'existingFiles': OBJECT|ARRAY If an object, the key for each entry is used in the file remove 
                            hidden input. An array uses the numeric index for the removal 
                            input 
                            (defaults to null, that is, no existing files)
'shiftLeft': STRING         HTML content for the button to shift left for multiple file 
                            inputs 
                            (defaults to "<<")
'shiftRight': STRING        HTML content for the button to shift right for multiple file 
                            inputs 
                            (defaults to ">>")
'iconPath': STRING          The path to the folder containing icon images (when a preview is 
                            unavailable) - should be absolute, but if relative, must be 
                            relative to the page the file input is on 
                            (defaults to cur. dir.)
'defaultIcon': STRING       The file name to use for the defualt preview icon (when a proper 
                            file-type-specific icon cannot be found) 
                            (defaults to "preview_file.png")
'icons': OBJECT             A mapping of file type (second half of mime type) to icon image 
                            file (used in combination with the "iconPath" option)
                            (default value includes most common file types in this format:
                            {'png': 'preview_png.png', ...}
'limit': INTEGER            On multiple files, set a limit
'removeMessage': {
    'prefix': STRING        Prefix for remove message
                            (defaults to "Remove")
    'stub': STRING          Stub instead of the file name for remove message
}                           (defaults to "this file")
'radio': {                  Display the radio buttons (if necessary) to mark one of the files (only multiple mode)
                            (defaults to null (no display the radio buttons))
    'name': STRING          Name of input element
                            (defaults to null)
    'checkedItem': STRING  Preselect radio button
}                           (defaults to null)
'readOnly': BOOLEAN         Display with no possibility of modification
                            (defaults to false)
'ajaxUpload': {             Upload file via AJAX
                            (defaults to null)
    'url': STRING           URL for upload file
                            (defaults to null)
    'progressbar': BOOLEAN  progressbar for upload file (required Bootstrap)
                            (defaults to false)
    'success': FUNCTION     callback for ajax success function
                            (defaults to null)
    'error': FUNCTION       callback for ajax error function
                            (defaults to null)
    'compose': FUNCTION     callback for before send FormData customization
}                           (defaults to null)
'beforeRemove'              callback for before remove element
                            (defaults to null)

```

### Basic Usage

_Single File_

```html
<input type='file' id='ex1' name='ex1' />
```

```js
$('input[type=file]').simpleFilePreview();
```

_Multiple Files_

```html
<input type='file' id='ex2' name='ex2[]' multiple='multiple' />
```

```js
$('input[type=file]').simpleFilePreview();
```

You can see [more examples](http://jordankasper.com/jquery/preview/examples) on my personal site.

### Tested Browsers</h3>

* Firefox 16+
* Internet Explorer 8+
* Chrome 22+
