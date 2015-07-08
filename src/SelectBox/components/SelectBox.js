import React from 'react';

import {
    BLUR_DELAY_MS,
    debounce,
    getClassName,
    KEY_CODES,
    noop
} from '../../utils';


class SelectBox extends React.Component {
    constructor(...args) {
        super(...args);

        this.state = {
            highlightIndex: -1,
            showDropDown: false,
            value: this.props.defaultValue
        };
        this.delayBlur = debounce(
            this.onBlur.bind(this),
            BLUR_DELAY_MS
        );
        this.delaySearch = debounce(
            this.onSearch.bind(this),
            this.props.delay
        );
        this.onClick = this.onClick.bind(this);
        this.onDropDownClick = this.onDropDownClick.bind(this);
        this.onSearchFocus = this.onSearchFocus.bind(this);
        this.onClearClick = this.onClearClick.bind(this);
    }

    render() {
        const className = getClassName(
            'react-ui-select-box',
            this.props.className,
            this.state.showDropDown ? 'react-ui-select-box-open' : '',
            this.props.disabled ? 'react-ui-select-box-disabled' : ''
        );

        return (
            <div
            className={className}
            onBlur={this.delayBlur}
            onClick={this.onClick}
            tabIndex={9999}>
                <div className="react-ui-select-box-inner">
                    {this.renderValue()}

                    <div className="react-ui-select-box-controls">
                        {this.renderClear()}
                        {this.renderTrigger()}
                    </div>
                </div>

                {this.renderDropDown()}
            </div>
        );
    }

    renderValue() {
        const className = getClassName(
            'react-ui-select-box-value',
            this.props.valueClassName,
            !this.state.value ? 'react-ui-select-box-placeholder' : ''
        );
        const display = (
            this.state.value ?
            this.state.value[this.props.displayProp] :
            this.props.placeholder
        );
        const value = (
            this.state.value ?
            this.state.value[this.props.valueProp] :
            this.state.value
        );

        return (
            <span className={className}>
                <input
                disabled={this.props.disabled}
                name={this.props.name}
                type="hidden"
                value={value} />

                {display}
            </span>
        );
    }

    renderDropDown() {
        const className = getClassName(
            'react-ui-select-box-drop-down',
            this.props.dropDownClassName
        );
        const optionsClassName = getClassName(
            'react-ui-select-box-options',
            this.props.optionsClassName
        );

        return this.state.showDropDown ? (
            <div
            className={className}
            onDropDownClick={this.onDropDownClick}>
                {this.renderSearch()}

                <div className={optionsClassName}>
                    {this.renderOptions()}
                </div>
            </div>
        ) : null;
    }

    renderClear() {
        const className = getClassName(
            'react-ui-select-box-clear',
            this.props.clearClassName
        );

        return this.props.showClear && this.state.value ? (
            <span
            className={className}
            onClick={this.onClearClick}>
            </span>
        ) : null;
    }

    renderTrigger() {
        const className = getClassName(
            'react-ui-select-box-trigger',
            this.props.triggerClassName
        );

        return (<span className={className}></span>);
    }

    renderSearch() {
        const className = getClassName(
            'react-ui-select-box-search',
            this.props.searchClassName
        );
        const options = this.getOptions();
        const filteredOptions = this.filterOptions(options);

        return options.length >= this.props.searchThreshold ? (
            <div className={className}>
                <input
                autoFocus={true}
                onClick={this.onSearchFocus}
                onFocus={this.onSearchFocus}
                onChange={this.delaySearch}
                onKeyDown={this.onSearchKeyDown.bind(this, filteredOptions)}
                ref="search"
                type="text" />
            </div>
        ) : null;
    }

    renderOptions() {
        return this.filterOptions().map((option, i) => {
            const className = getClassName(
                'react-ui-select-box-option',
                this.props.optionClassName,
                (
                    this.isOptionSelected(option) ?
                    'react-ui-select-box-option-selected' :
                    ''
                ),
                (
                    i === this.state.highlightIndex ?
                    'react-ui-select-box-option-highlighted' :
                    ''
                )
            );

            return (
                <div
                className={className}
                key={i}
                onClick={this.onChange.bind(this, option)}>
                    {this.renderOption(option)}
                </div>
            );
        });
    }

    renderOption(option) {
        return (
            this.props.renderOption(option) ||
            option[this.props.displayProp]
        );
    }

    onChange(option, evt) {
        this.props.onChange(evt, option);

        this.setState({
            highlightIndex: -1,
            showDropDown: false,
            value: option
        });
    }

    onClearClick(evt) {
        evt.stopPropagation();
        this.props.onClearClick(evt);
        this.delayBlur.cancel();
        this.clear();
    }

    onClick(evt) {
        this.props.onClick(evt, this.state.showDropDown, this.props.disabled);

        if (!this.props.disabled) {
            if (this.state.showDropDown) {
                this.hideDropDown();
            } else {
                this.showDropDown();
            }
        }
    }

    onDropDownClick() {
        this.delayBlur.cancel();
    }

    onBlur() {
        this.hideDropDown();
        this.clearQuery();
    }

    onSearch() {
        const query = React.findDOMNode(
            this.refs.search
        ).value.toLowerCase();

        this.props.onSearch(query);
        this.setState({query});
    }

    onSearchFocus(evt) {
        evt.stopPropagation();
        this.delayBlur.cancel();
    }

    onSearchKeyDown(options, evt) {
        if (evt.keyCode === KEY_CODES.ENTER && this.state.highlightIndex > -1) {
            this.onChange(
                options[this.state.highlightIndex],
                evt
            );
        } else if (evt.keyCode === KEY_CODES.ARROW_DOWN) {
            this.highlightIndex(this.state.highlightIndex + 1, options);
        } else if (evt.keyCode === KEY_CODES.ARROW_UP) {
            this.highlightIndex(this.state.highlightIndex - 1, options);
        }
    }

    getOptions() {
        return this.props.options || (
            this.props.children && this.props.children.length !== undefined ?
            this.props.children : [this.props.children]
        ).filter(
            (child) => child && child.type === 'option'
        ).map((child) => ({
            [this.props.displayProp]: child.props.children,
            [this.props.valueProp]: child.props.value || child.props.children
        }));
    }

    filterOptions(options) {
        options = options || this.getOptions();

        return this.state.query ? options.filter(
            option => option[this.props.displayProp].toLowerCase().includes(
                this.state.query
            )
        ) : options;
    }

    isOptionSelected(option) {
        const value = this.state.value;

        return !!(
            option &&
            value &&
            option[this.props.valueProp] === value[this.props.valueProp] &&
            option[this.props.displayProp] === value[this.props.displayProp]
        );
    }

    highlightIndex(index, options) {
        if (index >= options.length) {
            index = options.length - 1;
        }

        if (index < 0) {
            index = 0;
        }

        this.setState({highlightIndex: index});
    }

    clear() {
        this.setState({
            highlightIndex: -1,
            value: undefined
        });
    }

    clearQuery() {
        this.setState({query: ''});
    }

    hideDropDown() {
        this.setState({showDropDown: false});
    }

    showDropDown() {
        this.setState({showDropDown: true});
    }
}

SelectBox.propTypes = {
    className: React.PropTypes.string,
    clearClassName: React.PropTypes.string,
    displayProp: React.PropTypes.string,
    dropDownClassName: React.PropTypes.string,
    name: React.PropTypes.string,
    onChange: React.PropTypes.func,
    onClearClick: React.PropTypes.func,
    onClick: React.PropTypes.func,
    options: React.PropTypes.array,
    optionClassName: React.PropTypes.string,
    optionsClassName: React.PropTypes.string,
    renderOption: React.PropTypes.func,
    placeholder: React.PropTypes.string,
    searchThreshold: React.PropTypes.number,
    showClear: React.PropTypes.bool,
    valueClassName: React.PropTypes.string,
    valueProp: React.PropTypes.string
};

SelectBox.defaultProps = {
    delay: 400,
    disabled: false,
    displayProp: 'display',
    onChange: noop,
    onClearClick: noop,
    onClick: noop,
    onSearch: noop,
    placeholder: '',
    remote: false,
    renderOption: noop,
    searchThreshold: 5,
    showClear: true,
    valueProp: 'value'
};

export default SelectBox;
