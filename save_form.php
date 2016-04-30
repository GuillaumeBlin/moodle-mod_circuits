<?php
defined('MOODLE_INTERNAL') || die();

require_once("$CFG->libdir/formslib.php");
 
class savehtml_form extends moodleform {
 
    function definition() {
        global $CFG;
 
        $mform = $this->_form; 
        $this->add_action_buttons(false,"save");
    }          
} 
