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
 * Library of interface functions and constants for module circuits
 *
 * @package    mod_circuits
 * @copyright  2016 Guillaume Blin
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/* Moodle core API */

/**
 * Returns the information on whether the module supports a feature
 *
 * See {@link plugin_supports()} for more info.
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed true if the feature is supported, null if unknown
 */
function circuits_supports($feature) {

    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
//        case FEATURE_GRADE_HAS_GRADE:
//            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        default:
            return null;
    }
}

/**
 * Saves a new instance of the circuits into the database
 *
 * Given an object containing all the necessary data,
 * (defined by the form in mod_form.php) this function
 * will create a new instance and return the id number
 * of the new instance.
 *
 * @param stdClass $circuits Submitted data from the form in mod_form.php
 * @param mod_circuits_mod_form $mform The form instance itself (if needed)
 * @return int The id of the newly inserted circuits record
 */
function circuits_add_instance(stdClass $circuits, mod_circuits_mod_form $mform = null) {
    global $DB;

    	$circuits->timecreated 	= time();
	$circuits->json     	= $mform->get_data()->json;	
	$circuits->devices      = $mform->get_data()->devices;
	$circuits->width        = $mform->get_data()->width;
        $circuits->height       = $mform->get_data()->height;
        $circuits->toolbox      = implode("#",$mform->get_data()->toolbox); 
    	$circuits->id           = $DB->insert_record('circuits', $circuits);
	return $circuits->id;
}

/**
 * Updates an instance of the circuits in the database
 *
 * Given an object containing all the necessary data,
 * (defined by the form in mod_form.php) this function
 * will update an existing instance with new data.
 *
 * @param stdClass $circuits An object from the form in mod_form.php
 * @param mod_circuits_mod_form $mform The form instance itself (if needed)
 * @return boolean Success/Fail
 */
function circuits_update_instance(stdClass $circuits, mod_circuits_mod_form $mform = null) {
    global $DB;

    	$circuits->timemodified = time();
    	$circuits->id		= $circuits->instance;
        $circuits->json     	= $mform->get_data()->json;
	$circuits->devices      = $mform->get_data()->devices;
	$circuits->width	= $mform->get_data()->width;
	$circuits->height       = $mform->get_data()->height;
	$circuits->toolbox	= implode("#",$mform->get_data()->toolbox);
	$result 		= $DB->update_record('circuits', $circuits);
    	return $result;
}

/**
 * Removes an instance of the circuits from the database
 *
 * Given an ID of an instance of this module,
 * this function will permanently delete the instance
 * and any data that depends on it.
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function circuits_delete_instance($id) {
    global $DB;

    if (! $circuits = $DB->get_record('circuits', array('id' => $id))) {
        return false;
    }
    // Delete any dependent records here.
    $DB->delete_records('circuits', array('id' => $circuits->id));
    return true;
}


