from api.ttn.end_devices import EndDevice, TTNApi

import pytest

# global API instance
api = TTNApi(
    app_id = "soil-power-sensor",
)

def test_create_end_device():
    """Test creating an End Device in the TTN registry."""

    data = {
        # general requirements 
        "ids": {
            "device_id": "dirtviz-unit-test",
            "dev_eui": "0080E1150546D093",
            "join_eui": "0101010101010101",
        },
        "network_server_address": "nam1.cloud.thethings.network",
        "application_server_address": "nam1.cloud.thethings.network",
        "join_server_address": "nam1.cloud.thethings.network",
        # end device registry
        "name": "Dirtviz Unit Test",
        # network server
        "lorawan_version": "MAC_V1_0_3",
        "lorawan_phy_version": "PHY_V1_0_3_REV_A",
        "frequency_plan_id": "US_902_928_FSB_2",
        "mac_settings": {
            "rx2_data_rate_index": 8,
            "rx2_frequency": 923300000,
        },
        "supports_join": True,
        "multicast": False,
        "supports_class_b": False,
        "supports_class_c": False,
        # required for js
        "root_keys": {
            "app_key": {
                "key": "CEC24E6A258B2B20A5A7C05ABD2C1724",
            },
        },
    }

    end_device = EndDevice(data)

    end_device = api.register_end_device(end_device)

    assert end_device is not None
    assert end_device.data["name"] == "Dirtviz Unit Test"
    assert "ids" in end_device.data
    assert end_device.data["ids"]["device_id"] == "dirtviz-unit-test"
    assert end_device.data["ids"]["dev_eui"] == "0080E1150546D093"
    assert end_device.data["ids"]["join_eui"] == "0101010101010101"
    assert "created_at" in end_device.data
    assert "updated_at" in end_device.data


def test_get_end_device():
    """Test retrieving an End Device from the TTN registry."""

    data = {
        "ids": {
            "device_id": "dirtviz-unit-test",
        },
    }

    end_device = EndDevice(data)

    end_device = api.get_end_device(end_device)

    assert end_device is not None
    assert end_device.data["ids"]["device_id"] == "dirtviz-unit-test"
    assert end_device.data["ids"]["dev_eui"] == "0080E1150546D093"
    assert end_device.data["ids"]["join_eui"] == "0101010101010101"


def test_get_all_end_device():
    """Test retrieving all End Devices from the TTN registry."""

    end_devices = api.get_all_end_devices()

    assert len(end_devices) > 0


def test_get_list_end_device():
    """Test retrieving an End Device from the TTN registry."""

    # get a list of all end devices
    end_devices = api.get_end_device_list()
    assert len(end_devices) > 0

    # get a list of end devices with a specific device ID
    # NOTE: This is not functional because I don't understnad how the filtering
    # mechanism works in the TTN API. Just get by a specific device ID for now.
    # filters = { "device_id": "dirtviz-unit-test", }

    # end_devices = api.get_end_device_list(filters=filters)
    # assert len(end_devices) == 1


def test_update_end_device():
    """Test updating an End Device in the TTN registry."""

    data = {
        "description": "Unit tests update description",
        "ids": {
            "device_id": "dirtviz-unit-test",
        },
    }

    end_device = EndDevice(data)
    updated = api.update_end_device(end_device)

    assert updated is True


def test_delete_end_device():
    """Test deleting an End Device in the TTN registry."""

    data = {
        "ids": {
            "device_id": "dirtviz-unit-test",
        },
    }

    end_device = EndDevice(data)

    # test deleting an end device that exists
    deleted = api.delete_end_device(end_device)

    assert deleted is True


@pytest.mark.filterwarnings("ignore:ttn")
def test_delete_end_device_not_found():
    """Test deleting an End Device that does not exist in the TTN registry."""

    data = {
        "ids": {
            "device_id": "non-existent-device",
        },
    }

    end_device = EndDevice(data)

    deleted = api.delete_end_device(end_device)

    assert deleted is False
