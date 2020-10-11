//abcjs in production url should be https://rawcdn.githack.com/paulrosen/abcjs/f9ab28cee87a7023c7e374c3481cb6cadc0c192c/bin/abcjs_basic_5.10.3-min.js

var abc_start, abc_end, $$, $val, setCaretPosition, packaged_patterns;

$$ = function (id) {
  return document.getElementById(id);
};

$val = function (id) {
  return $$(id).value;
};

document.addEventListener("DOMContentLoaded", function () {
  var elems = document.querySelectorAll("select");
  var instances = M.FormSelect.init(elems);
  var more_elems = document.querySelectorAll("select.hide");
  var more_instances = M.FormSelect.init(more_elems, { classes: "hide" });
  var elems = document.querySelectorAll(".modal");
  var instances = M.Modal.init(elems);
  //M.AutoInit();
  abc_start = ABCJS.renderAbc(
    "startnote_paper",
    "L:1/4 \nM: \n C",
    {},
    { staffwidth: 75, responsive: "resize", add_classes: true }
  );
  abc_end = ABCJS.renderAbc(
    "endnote_paper",
    "L:1/4 \nM: \n E'",
    {},
    { staffwidth: 75, responsive: "resize", add_classes: true }
  );

  abc_editor = new ABCJS.Editor("composition", {
    paper_id: "paper",
    warnings_id: "warnings"
  });
});

$$("exegen").addEventListener("click", function (e) {
  e.preventDefault();
  return exeGenerate();
});

$$("btn-back").addEventListener("click", function (e) {
  e.preventDefault();
  $(".flip-container").toggleClass("reveal");
});

$("#startnoteup").click(function () {
  var nextElement = $("#startnote > option:selected").next("option");
  if (nextElement.length > 0) {
    if (nextElement[0].value == $val("endnote")) {
      $("#endnoteup").click();
    }
    $("#startnote").val(nextElement[0].value);
    var this_select = document.querySelectorAll("#startnote");
    M.FormSelect.init(this_select, { classes: "hide" });
    abc_start = ABCJS.renderAbc(
      "startnote_paper",
      "L:1/4 \nM: \n " + nextElement[0].value,
      {},
      { staffwidth: 75, responsive: "resize", add_classes: true }
    );
  }
});

$("#startnotedown").click(function () {
  var nextElement = $("#startnote > option:selected").prev("option");
  if (nextElement.length > 0) {
    $("#startnote").val(nextElement[0].value);
    var this_select = document.querySelectorAll("#startnote");
    M.FormSelect.init(this_select, { classes: "hide" });

    abc_start = ABCJS.renderAbc(
      "startnote_paper",
      "L:1/4 \nM: \n " + nextElement[0].value,
      {},
      { staffwidth: 75, responsive: "resize", add_classes: true }
    );
  }
});

$("#endnoteup").click(function () {
  var nextElement = $("#endnote > option:selected").next("option");
  if (nextElement.length > 0) {
    $("#endnote").val(nextElement[0].value);
    var this_select = document.querySelectorAll("#endnote");
    M.FormSelect.init(this_select, { classes: "hide" });
    abc_start = ABCJS.renderAbc(
      "endnote_paper",
      "L:1/4 \nM: \n " + nextElement[0].value,
      {},
      { staffwidth: 75, responsive: "resize", add_classes: true }
    );
  }
});

$("#endnotedown").click(function () {
  var nextElement = $("#endnote > option:selected").prev("option");
  if (nextElement.length > 0) {
    if (nextElement[0].value == $val("startnote")) {
      $("#startnotedown").click();
    }
    $("#endnote").val(nextElement[0].value);
    var this_select = document.querySelectorAll("#endnote");
    M.FormSelect.init(this_select, { classes: "hide" });

    abc_start = ABCJS.renderAbc(
      "endnote_paper",
      "L:1/4 \nM: \n " + nextElement[0].value,
      {},
      { staffwidth: 75, responsive: "resize", add_classes: true }
    );
  }
});

exeGenerate = function () {
  var $composition, front_matter, i, pattern, settings;
  settings = readSettings();
  console.log("readSettings", settings);

  var exegen = []; //new result var in tonal notes objects array format.
  _current_note_pointer = settings.index_of_low_tonic_in_range;
  exegen.push(settings.options_arr[settings.index_of_low_tonic_in_range]); //Step 2 "print" first note.

  //Step 3 Run the pattern until reaching end of range:
  _current_move_pattern = settings.patterns_scale.map((x) => parseInt(x)); // running pattern array as integers.
  while (
    _current_note_pointer +
      Math.max.apply(Math, _current_move_pattern.reduce(cul_sum, [])) <
    settings.options_arr.length
  ) {
    //pattern is in range, add it to array and update _current_note_pointer
    _current_move_pattern.forEach(function (move) {
      _current_note_pointer = _current_note_pointer + move;
      exegen.push(settings.options_arr[_current_note_pointer]);
    });
  }
  //reverse running pattern and repeat for reverse:
  _current_move_pattern = _current_move_pattern.reverse().map((x) => -x);

  while (_current_note_pointer > 0) {
    //pattern is in range, add it to array and update _current_note_pointer
    _current_move_pattern.forEach(function (move) {
      _current_note_pointer = _current_note_pointer + move;
      if (
        _current_note_pointer > -1 &&
        _current_note_pointer < settings.options_arr.length
      )
        exegen.push(settings.options_arr[_current_note_pointer]);
    });
  }

  //now reverse pattern again and move until starting tonic note:
  _current_move_pattern = _current_move_pattern.reverse().map((x) => -x);
  while (_current_note_pointer < settings.index_of_low_tonic_in_range) {
    //pattern is in range, add it to array and update _current_note_pointer
    _current_move_pattern.forEach(function (move) {
      _current_note_pointer = _current_note_pointer + move;
      exegen.push(settings.options_arr[_current_note_pointer]);
    });
  }

  console.log("exegen readyfor parsing: ", exegen);
  if (exegen.length < 2) {
    M.toast({ html: "Not enough range to play pattern.", classes: "error" });
    return;
  }
  //if (exegen.length > 49) settings.row_count++;
  settings.row_count = Math.ceil(exegen.length / 25);

  var abcexegen = _tonal_to_abc_string(exegen); //Step 5 print pattern in abcjs format:
  $composition = $$("composition");
  var row_ready_myxgen = groupArr(
    abcexegen,
    Math.floor(abcexegen.length / settings.row_count + 1)
  );

  abc_editor.paramChanged({
    //staffwidth: settings.staffwidth,
    add_classes: true,
    midi_id: "midi",
    responsive: "resize",
    viewportHorizontal: true,
    inlineControls: {
      loopToggle: true,
      tempo: true
    }
  });

  var keytxt = "";
  if (settings.showscalekey) {
    keytxt = "K: " + settings.key + "\n";
  }
  $composition.value =
    "T: \nK:C major clef=" +
    settings.clef +
    " \nL:" +
    settings.unit +
    "\nS:Copyright 2020, Rea & Tom Meir\nR:\nC:Generated by OnKey\n%%stretchlast .7\n" +
    keytxt +
    " y " +
    row_ready_myxgen.map((x) => x.join(" ")).join(" \n y ") +
    "||";
  //push the update :
  setCaretPosition($composition, 0);
  abc_editor.fireChanged();
  $(".flip-container").toggleClass("reveal");
};

readSettings = function () {
  var settings, $tonic;
  settings = {};

  $savedpattern = $$("savedpattern");
  settings.patterns_scale =
    packaged_patterns[$savedpattern.options[$savedpattern.selectedIndex].value];
  settings.clef = "treble"; // also can be alto, tenor, or bass.
  $tonic = $$("tonic");
  settings.tonic = $tonic.options[$tonic.selectedIndex].value;
  $scale = $$("scale");
  settings.scale = $scale.options[$scale.selectedIndex].value;
  settings.bottomnote = $val("startnote");
  settings.topnote = $val("endnote");
  settings.tonal_topnote = Tonal.note(toNote(settings.topnote));
  settings.tonal_bottomnote = Tonal.note(toNote(settings.bottomnote));
  settings.limit_count = 2;
  settings.row_count = 2;
  settings.unit = "1/4";

  //start build array of all optional notes:
  settings.options_arr = [];
  settings.options_arr = settings.options_arr.concat(
    Tonal.scale($scale.options[$scale.selectedIndex].value).map(
      Tonal.transpose(
        $tonic.options[$tonic.selectedIndex].value +
          parseInt(settings.tonal_bottomnote.octStr - 1)
      )
    )
  );
  for (
    let i = settings.tonal_bottomnote.octStr;
    i < parseInt(settings.tonal_topnote.octStr) + 1;
    i++
  ) {
    settings.options_arr = settings.options_arr.concat(
      Tonal.scale($scale.options[$scale.selectedIndex].value).map(
        Tonal.transpose($tonic.options[$tonic.selectedIndex].value + i)
      )
    );
  }

  // trim options_arr notes from start of array until they are above or equal startnote in midi value.
  while (
    Tonal.note(settings.options_arr[0]).midi < settings.tonal_bottomnote.midi
  ) {
    settings.options_arr.shift();
  }

  //trim options_arr notes from end of array until they are below or equal endnote in midi value.
  while (
    Tonal.note(settings.options_arr[settings.options_arr.length - 1]).midi >
    settings.tonal_topnote.midi
  ) {
    settings.options_arr.pop();
  }
  //settings.options_arr now is all allowed keys. Starting not from start tonic, but with first scale note in range.

  settings.index_of_low_tonic_in_range = _index_of_low_tonic_in_range(
    settings.options_arr,
    settings.tonic
  ); //step 1 find lowest tonic in range (between highest and lowest notes). If tonic not in range start on lowest note in scale in range+warning msg.
  if (settings.index_of_low_tonic_in_range < 0) {
    console.log("no tonic in range, using first note in range instead.");
    settings.index_of_low_tonic_in_range = 0;
  }

  return settings;
};

/*Helper Functions*/

setCaretPosition = function (elem, caretPos) {
  var range;
  if (elem.createTextRange) {
    range = elem.createTextRange();
    return range.move("character", caretPos);
  } else {
    if (elem.selectionStart !== void 0 && elem.offsetParent !== null) {
      return elem.setSelectionRange(caretPos, caretPos);
    }
  }
};

/** Takes an array, and int N.
 *  return an array of arrays with N items in each.
 */

function groupArr(data, n) {
  var a_group = [];

  for (var ia = 0, ja = 0; ia < data.length; ia++) {
    if (ia >= n && ia % n === 0) {
      ja++;
    }

    a_group[ja] = a_group[ja] || [];
    a_group[ja].push(data[ia]);
  }

  return a_group;
}

_tonal_to_abc_string = function (_current_exegen) {
  var x = [];
  _current_exegen.forEach(function (note) {
    x.push(toAbc(note));
  });
  return x;
};

_index_of_low_tonic_in_range = function (notes_options, starting_tonic) {
  return notes_options.findIndex(
    (item) => item.substring(0, item.length - 1) == starting_tonic
  );
};

var _slicedToArray = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;
    try {
      for (
        var _i = arr[Symbol.iterator](), _s;
        !(_n = (_s = _i.next()).done);
        _n = true
      ) {
        _arr.push(_s.value);
        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError(
        "Invalid attempt to destructure non-iterable instance"
      );
    }
  };
})();

cul_sum = function (r, a) {
  r.push(((r.length && r[r.length - 1]) || 0) + parseInt(a));
  return r;
};

var REGEX = /^(_{1,}|=|\^{1,}|)([abcdefgABCDEFG])([,']*)$/;

var fillStr = function fillStr(s, n) {
  return Array(n + 1).join(s);
};

function tokenize(str) {
  var m = REGEX.exec(str);
  if (!m) return ["", "", ""];
  return [m[1], m[2], m[3]];
}

/**
 * Convert a (string) note in ABC notation into a (string) note in scientific notation
 *
 * @param {String} abcNote - the note in ABC notation
 * @return {String} the note in scientific notation of null if not valid
 * @example
 * Abc.toNote("c") // => "C5"
 */
function toNote(str) {
  var _tokenize = tokenize(str),
    _tokenize2 = _slicedToArray(_tokenize, 3),
    acc = _tokenize2[0],
    letter = _tokenize2[1],
    oct = _tokenize2[2];

  if (letter === "") return null;
  var o = 4;
  for (var i = 0; i < oct.length; i++) {
    o += oct[i] === "," ? -1 : 1;
  }

  var a =
    acc[0] === "_"
      ? acc.replace(/_/g, "b")
      : acc[0] === "^"
      ? acc.replace(/\^/g, "#")
      : "";
  //return letter.charCodeAt(0) > 96 ? letter.toUpperCase() + a : letter + a;
  return letter.charCodeAt(0) > 96
    ? letter.toUpperCase() + a + (o + 1)
    : letter + a + o;
}

/**
 * Convert a (string) note in scientific notation into a (string) note in ABC notation
 *
 * @param {String} note - a note in scientific notation
 * @return {String} the note in ABC notation or null if not valid note
 * @example
 * abc.toAbc("C#4") // => "^C"
 */
function toAbc(str) {
  var _note = Tonal.note(str);
  var letter = _note.letter,
    acc = _note.acc,
    oct = _note.oct;
  var a = acc[0] === "b" ? acc.replace(/b/g, "_") : acc.replace(/#/g, "^");
  var l = oct > 4 ? letter.toLowerCase() : letter;
  var o =
    oct === 5 ? "" : oct > 4 ? fillStr("'", oct - 5) : fillStr(",", 4 - oct);
  return a + l + o;
}
function toAbc_mini(str) {
  //return abc notation without octave , always in lowercase

  var _note = Tonal.note(str);
  var letter = _note.letter,
    acc = _note.acc,
    oct = _note.oct;
  var a = acc[0] === "b" ? acc.replace(/b/g, "_") : acc.replace(/#/g, "^");
  var l = letter.toLowerCase();
  var o =
    oct === 5 ? "" : oct > 4 ? fillStr("'", oct - 5) : fillStr(",", 4 - oct);
  return a + l;
}

function getMaxSubSum(arr) {
  let maxSum = 0;
  let partialSum = 0;

  for (let item of arr) {
    // for each item of arr
    partialSum += item; // add it to partialSum
    maxSum = Math.max(maxSum, partialSum); // remember the maximum
    if (partialSum < 0) partialSum = 0; // zero if negative
  }

  return maxSum;
}

packaged_patterns = {
  default: [1],
  three_note_group: [1, 1, -1],
  four_note_group: [1, 1, 1, -2],
  skip_up_step_down: [2, -1],
  diatonic_triads: [2, 2, -3],
  diatonic_7th_chord: [2, 2, 2, -5],
  octaves: [1, 1, 1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1, -1]
};