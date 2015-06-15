jQuery SimpleFilePreview
----

SimpleFilePreview is a jQuery plug-in that allows for pre-form submission 
file previews on images and icon previews for non-images. The syntax is extremely
simple and the UI allows for easy CSS styling.
  
**Requires: jQuery 1.9.1+, Bootstrap 3.3.4+ (for progressbar only), jQuery UI 1.11.4+ (for dialog only)**

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
    'progressbar': BOOLEAN  Progressbar for upload file (required Bootstrap)
                            (defaults to false)
    'success': FUNCTION     Callback for ajax success function
                            (defaults to null)
    'error': FUNCTION       Callback for ajax error function
                            (defaults to null)
    'compose': FUNCTION     Callback for before send FormData customization
}                           (defaults to null)
'beforeRemove'              Callback for before remove element
                            (defaults to null)
'removeDialog': {           Dialog for remove file (required jQuery UI)
                            (defaults to null)
    'id': STRING            Dialog Id
                            (defaults to "***_remove_dialog")
    'title': STRING         Title dialog
                            (defaults to "Remove")
    'text': STRING          Body text
                            (defaults to "Are you sure?")
    'ok': STRING            Text for OK button
                            (defaults to "Ok")
    'cancel': STRING        Text for Cancel button
                            (defaults to "Cancel")
}
'contextMenu': {            Context menu for select file source
                            (defaults to null)
    'fileText': STRING      Text for file option
                            (defaults to "Open file")
    'linkText': STRING      Text for link option
                            (defaults to "Open link")
    'id': STRING            Dialog Id
                            (defaults to "***_openlink_dialog")
    'title': STRING         Title dialog
                            (defaults to "Open link")
    'text': STRING          Body text
                            (defaults to "Please enter link to file or image")
    'optionName': STRING    Name of input link to image or file
                            (defaults to "Link")
    'ok': STRING            Text for OK button
                            (defaults to "Ok")
    'cancel': STRING        Text for Cancel button
                            (defaults to "Cancel")
    'inputName': STRING     Name of hidden input element
                            (defaults to "input_openlink_dialog")
}
'parentSelector': STRING    Parent selector for component
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

### Tested Browsers

* Firefox 16+
* Internet Explorer 8+
* Chrome 22+

### NuGet repository

https://www.myget.org/F/zorg-public/api/v2