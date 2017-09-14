import ProBadge from "./ProBadge";
import React, { Component } from "react";
import PropTypes from "prop-types";
import TieredColorPicker from "./TieredColorPicker";
import getFeatureValue from "@common/utils/features";
import tieredDecorator from "@workspace/utils/tieredDecorator";
import tinycolor from "tinycolor2";
import { currentUserOrNull } from "@workspace/utils/customPropTypes";
import {
  tierColors,
  hasInaccessibleFeature,
} from "@workspace/utils/checkFigureFeatureAccess";

class ColorPicker extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedColor: tinycolor(props.selectedColor),
      isVisible: false,
    };

    this.isAccessible = this.isAccessible.bind(this);
    this.onSelectedColorChange = this.onSelectedColorChange.bind(this);
    this.toColorBuffer = this.toColorBuffer.bind(this);
    this.toggleVisible = this.toggleVisible.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const newColor = tinycolor(nextProps.selectedColor);
    const { selectedColor } = this.state;

    if (newColor.toRgbString() !== selectedColor.toRgbString()) {
      this.setState({ selectedColor: newColor });
    }
  }

  /**
     * Determine if the color is accessible
     * @param {obj} color object from tiny color
     *
     * @returns {bool} true if color is accessible, false otherwise
     *
     */
  isAccessible(color) {
    const user = this.context.currentUser;
    const feature_set = user ? user.feature_set_id : null;
    const { featureName, validations } = tierColors;

    const allowedColors = getFeatureValue(feature_set, featureName);

    return !hasInaccessibleFeature(color, allowedColors, validations);
  }

  toColorBuffer(color) {
    /**
         * @param {obj} c, an object that contains rgba field. Either it
         * has a field called 'rgb' that contains a rgba object or it is a rgba
         * object
         *
         * @returns {obj} returns c.rgb if it exits if it doesn't exist, it
         * measn that the object itself is a rgba object
         */
    const extractRGB = c => c.rgb || c;

    /*
         * If it contains rgb info, we extract its rgb object, else we return
         * its hex
         */
    const getColorSource = c => (c.source === "rgb" ? extractRGB(c) : c.hex);

    return tinycolor(getColorSource(color));
  }

  /**
     * Note: this handler cannot be used alone without being decorated by tiered
     * decorator
     *
     * @param {obj} color, object from tinycolor
     *
     * @returns {void} calls restyle
     */
  onSelectedColorChange(color) {
    this.setState({ selectedColor: color });

    const newColor = color.toRgbString();

    /*
         * Call whatever onColorChange was passed in with the same value!
         * relayout call only wants a RGB String
         */
    this.props.onColorChange(newColor);
  }

  toggleVisible() {
    this.setState({ isVisible: !this.state.isVisible });
  }

  render() {
    const { featureName } = tierColors;

    const tieredOnSelectedColorChange = tieredDecorator(
      this.onSelectedColorChange,
      this.isAccessible,
      featureName,
      this.props.dispatch,
      this.toColorBuffer
    );

    const { selectedColor } = this.state;

    const colorText = selectedColor.toHexString();

    /*
         * We need inline style here to assign the background color
         * dynamically.
         */
    const swatchStyle = {
      backgroundColor: selectedColor.toRgbString(),
    };

    return (
      <div className="colorpicker-container js-colorpicker-container">
        <div className="colorpicker">
          <div
            ref="swatch"
            className="colorpicker-swatch +cursor-clickable js-colorpicker-swatch"
            style={swatchStyle}
            onClick={this.toggleVisible}
          />
        </div>

        <div
          ref="selectedColorText"
          className="colorpicker-selected-color +hover-grey"
          onClick={this.toggleVisible}
        >
          {colorText}
        </div>

        <ProBadge
          hide={this.isAccessible(selectedColor)}
          className="--inline-margin"
        />

        {this.state.isVisible ? (
          <div className="color-picker__popover js-color-picker-popover">
            <div className="color-picker__cover" onClick={this.toggleVisible} />
            <TieredColorPicker
              ref="react-color"
              color={selectedColor.toRgbString()}
              onChangeComplete={tieredOnSelectedColorChange}
            />
          </div>
        ) : null}
      </div>
    );
  }
}

ColorPicker.propTypes = {
  onColorChange: PropTypes.func.isRequired,
  selectedColor: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};

ColorPicker.contextTypes = {
  currentUser: currentUserOrNull.isDefined,
};

module.exports = ColorPicker;
