from api.ttn.end_devices import EndDevice, TTNApi

import pytest

# global API
api = TTNApi(
    "",
    "soil-power-sensor"
)

def test_create_end_device():
    """Test creating an End Device in the TTN registry."""

    data = {
        "name": "Dirtviz Unit Test",
        "ids": {
            "device_id": "dirtviz-unit-test",
            "dev_eui": "0080E1150546D093",
            "join_eui": "0101010101010101",
        },
        "lorawan_version": EndDevice.MACVersion.MAC_V1_0_3.value,
        "lorawan_phy_version": EndDevice.PHYVersion.RP001_V1_0_3_REV_A.value,
        "frequency_plan_id": "US_902_928_FSB_2",
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

    pass

def test_update_end_device():
    """Test updating an End Device in the TTN registry."""

    pass

@pytest.mark.filterwarnings("ignore:ttn")
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

    # test deleting an end device that does NOT exist
    deleted = api.delete_end_device(end_device)

    assert deleted is False
