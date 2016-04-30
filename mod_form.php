<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * The main circuits configuration form
 *
 * It uses the standard core Moodle formslib. For more info about them, please
 * visit: http://docs.moodle.org/en/Development:lib/formslib.php
 *
 * @package    mod_circuits
 * @copyright  2016 Guillaume Blin
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 *
 * @package    mod_circuits
 * @copyright  2016 Guillaume Blin
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mod_circuits_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG, $DB;

        $mform = $this->_form;

        $mform->addElement('header', 'general', get_string('general', 'form'));

        $mform->addElement('text', 'name', get_string('circuitsname', 'circuits'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        $mform->addHelpButton('name', 'circuitsname', 'circuits');

        if ($CFG->branch >= 29) {
            $this->standard_intro_elements();
        } else {
            $this->add_intro_editor();
        }
	$tools=explode("#",get_string('circuitstbcomponents','circuits'));
	$select = $mform->addElement('select', 'toolbox', get_string('circuitstoolbox','circuits'), array_combine($tools,$tools)); 
	$select->setMultiple(true);
	$id = optional_param('update',-1, PARAM_INT);
	if($id!=-1){
		$course = $DB->get_record('course_modules', array('id'=> $id));
		$circ = $DB->get_record('circuits', array('id'=> $course->instance));
		$selectedtools=$circ->toolbox;
	$too='<script>
	var color, i, j, values="'.$selectedtools.'",    
	options = document.getElementById("id_toolbox").options;
	values=values.split("#");
	for ( i = 0; i < values.length; i++ ) {
    		for ( j = 0, color = values[i]; j < options.length; j++ ) {
        		options[j].selected = options[j].selected || color === options[j].text;
    		}
	}
	</script>';
	$mform->addElement('html',$too);
	}
	$attributes = array('size'=>'20');
	$mform->addElement('text', 'width', get_string('circuitswidth', 'circuits'), $attributes);
	$mform->addElement('text', 'height', get_string('circuitsheight', 'circuits'), $attributes);
        $mform->setType('width', PARAM_TEXT);
	$mform->setType('height', PARAM_TEXT);
	$mform->addRule('width', null, 'required',null, 'client');
	$mform->addRule('width', null, 'numeric',null, 'client');
        $mform->addRule('height', null, 'required',null, 'client');
	$mform->addRule('height', null, 'numeric',null, 'client');
 	
	$mform->addElement('textarea', 'json', get_string('circuitsjson', 'circuits'),'wrap="virtual" rows="50" cols="100"');
	$mform->addHelpButton('json', 'circuitsjson', 'circuits');

	$mform->addElement('textarea', 'devices', get_string('circuitsdevices', 'circuits'),'wrap="virtual" rows="50" cols="100"');
        $mform->addHelpButton('devices', 'circuitsdevices', 'circuits');

        // Add standard elements, common to all modules.
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules.
        $this->add_action_buttons();
    }
}
