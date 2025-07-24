from __future__ import annotations
import os
from enum import Enum
import warnings

import requests


class EndDevice:
    class PHYVersion(Enum):
        """PHY Version Enum for End Devices

        See https://www.thethingsindustries.com/docs/api/reference/grpc/end_device/#enum:PHYVersion
        """

        PHY_UNKNOWN = 0
        PHY_V1_0 = 1
        TS001_V1_0 = 1
        PHY_V1_0_1 = 2
        TS001_V1_0_1 = 2
        PHY_V1_0_2_REV_A = 3
        RP001_V1_0_2 = 3
        PHY_V1_0_2_REV_B = 4
        RP001_V1_0_2_REV_B = 4
        PHY_V1_1_REV_A = 5
        RP001_V1_1_REV_A = 5
        PHY_V1_1_REV_B = 6
        RP001_V1_1_REV_B = 6
        PHY_V1_0_3_REV_A = 7
        RP001_V1_0_3_REV_A = 7
        RP002_V1_0_0 = 8
        RP002_V1_0_1 = 9
        RP002_V1_0_2 = 10
        RP002_V1_0_3 = 11
        RP002_V1_0_4 = 12

    class MACVersion(Enum):
        """MAC Version Enum for End Devices

        See https://www.thethingsindustries.com/docs/api/reference/grpc/end_device/#enum:MACVersion
        """

        MAC_UNKNOWN = 0
        MAC_V1_0 = 1
        MAC_V1_0_1 = 2
        MAC_V1_0_2 = 3
        MAC_V1_1 = 4
        MAC_V1_0_3 = 5
        MAC_V1_0_4 = 6

    frequency_plans = [
        "US_902_928_FSB_2",
    ]

    def __init__(
        self,
        json_data: dict,
        **kwargs,
    ):
        """Initialize an EndDevice object.

        The kwargs overrides anything in the json_data.

        Args:
            json_data: JSON data to initialize the EndDevice.
            **kwargs: Additional keyword arguments to include in the EndDevice data.
        """

        self.data = json_data | kwargs

    def __repr__(self):
        """Return a string representation of the EndDevice object."""

        return f'EndDevice({self.id()}])'

    def id(self) -> str:
        """Return the device ID of the EndDevice.

        Returns:
            The device ID of the EndDevice.
        """

        return self.data["ids"]["device_id"]

    def update(self, new: dict) -> EndDevice:
        """Update the EndDevice data with new JSON data.

        Fields from `new` will overwrite existing fields in `self.data`.

        Args:
            new: JSON data to update the EndDevice.
        """

        self.data.update(new)
        return self

class TTNApi:
    """High level interface for The Things Network API."""

    def __init__(self, api_key: str = "", app_id: str = ""):
        """ Initialize the TTNApi.

        The param `api_key` is used to override the env variables
        `TTN_API_KEY`. Similarly the `app_id` is used to override the
        environment variable `TTN_APP_ID`. If the parameters are not set,

        Args:
            api_key: The API key for authentication.
            app_id: The application ID to associate with the End Devices.
        """

        if api_key == "":
            api_key_env = os.getenv("TTN_API_KEY")
            if api_key_env is None:
                raise ValueError("TTN_API_KEY environment variable is not set.")
            else:
                api_key = api_key_env

        if app_id == "":
            app_id_env = os.getenv("TTN_APP_ID")
            if app_id_env is None:
                raise ValueError("TTN_APP_ID environment variable is not set.")
            else:
                app_id = app_id_env

        self.end_device_reg = EndDeviceRegistry(api_key, app_id)
        self.js_device_reg = JoinServerDeviceRegistry(api_key, app_id)

    def register_end_device(
        self,
        end_device: EndDevice,
    ) -> EndDevice:
        """Register a new end device in the TTN registry.

        Args:
            end_device: The End Device object to register.

        Returns:
            EndDevice: The registered End Device object.
        """

        required_end_device_fields = [
            "name",
            "ids",
            "lorawan_version",
            "lorawan_phy_version",
            "frequency_plan_id",
        ]

        # check top level
        for k in required_end_device_fields:
            if k not in end_device.data:
                raise ValueError(f"Missing EndDevice field {k}")

        required_ids_fields = [
            "device_id",
            "dev_eui",
            "join_eui",
        ]

        # check ids
        for k in required_ids_fields:
            if k not in end_device.data["ids"]:
                raise ValueError(f"Missing EndDevice ids field {k}")

        end_device = self.end_device_reg.create(end_device)
        end_device = self.js_device_reg.create(end_device)

        # TODO reg with JS, NS, and AS

        return end_device

    def delete_end_device(
        self,
        end_device: EndDevice,
        force: bool = False,
    ) -> bool:
        """Delete an End Device from the TTN registry.

        The param `force` is useful if a device has not been deleted from the
        end device registry, join server, application server, or network
        server. It ignores the HTTP return codes and always returns true.
        Otherwise it will stop on the first error.

        Args:
            end_device: The End Device object to delete.
            force: Ignore http response codes and always return true

        Returns:
            True if the End Device was successfully deleted, False otherwise.
        """

        deleted = True

        # delete from device registry
        deleted = self.end_device_reg.delete(end_device)
        if not deleted and not force:
            return False

        # delete from join server


        # always return true if force is set
        if force:
            return True

        return deleted

    def update_end_device(
        self,
        end_device: EndDevice,
    ) -> EndDevice | None:
        """Update an End Device in the TTN registry.

        Args:
            end_device: The End Device object to update.

        Returns:
            The updated End Device object.
        """

        updated = self.end_device_reg.update(end_device)
        if updated is False:
            return updated

        return updated

    def get_end_device(
        self,
        end_device: EndDevice,
        field_mask: list[str] | None = None,
    ) -> EndDevice | None:
        """Get an End Device from the TTN registry.

        The end device must have ["ids"]["device_id"] set.

        Args:
            end_device: The End Device object to get.
            field_mask: List of fields to include in the response.

        Returns:
            The End Device object if found, None otherwise.
        """

        return self.end_device_reg.get(end_device, field_mask)

    def get_all_end_devices(
        self,
        field_mask: list[str] | None = None,
        order: str | None = None,
        limit: int | None = None,
        page: int | None = None,
    ) -> list[EndDevice] | None:
        """Get all End Devices in the TTN registry.

        The parameter `order` specifies the field mask to order the results by.
        Default ordering is by ID Prepend with a minus (-) to reverse the
        order.

        Args:
            field_mask: List of fields to include in the response.
            order: Order of the results by field mask.
            limit: Maximum number of results to return per page.
            page: Page number to retrieve.

        Returns:
           List of EndDevice objects.
        """

        return self.end_device_reg.get_all(field_mask, order, limit, page)

    def get_end_device_list(
        self,
        field_mask: list[str] | None = None,
        order: str | None = None,
        limit: int | None = None,
        page: int | None = None,
        filters: dict[str, str] | None = None,
    ) -> list[EndDevice] | None:
        """Get all End Devices in the TTN registry.

        The parameter `order` specifies the field mask to order the results by.
        Default ordering is by ID Prepend with a minus (-) to reverse the
        order.

        Args:
            field_mask: List of fields to include in the response.
            order: Order of the results by field mask.
            limit: Maximum number of results to return per page.
            page: Page number to retrieve.
            filters: Dictionary of filters to apply to the results.

        Returns:
            List of EndDevice objects.
        """

        return self.end_device_reg.get_list(field_mask, order, limit, page, filters)


class TTNApiEndpoint:
    def __init__(
        self,
        api_key: str,
        app_id: str,
        base_url: str = "https://nam1.cloud.thethings.network/api/v3",
    ):
        # copy parameters
        self.base_url = base_url
        self.app_id = app_id

        # initialize the session
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {api_key}"})
        self.session.headers.update({"Accept": "application/json"})
        self.session.headers.update({"User-Agent": "dirtviz/1.0"})
        self.session.headers.update({"Content-Type": "application/json"})


class EndDeviceRegistry(TTNApiEndpoint):
    """Registry for End Devices in The Things Network. The selection of the
    base URL is force to the eu1 cluster. See the following for more
    information

    https://www.thethingsindustries.com/docs/cloud/addresses/
    """

    def __init__(
        self,
        api_key: str,
        app_id: str,
    ):
        """Initialize the End Device Registry.

        Args:
            api_key: The API key for authentication.
            app_id: The application ID to associate with the End Devices.
        """

        base_url = "https://eu1.cloud.thethings.network/api/v3"

        super().__init__(api_key, app_id, base_url)

    def create(
        self,
        end_device: EndDevice,
    ) -> EndDevice | None:
        """Create a new End Device in the registry.

        Args:
            end_device: The End Device object to create.

        Returns:
            The created End Device object.
        """

        # TODO Add application ID to the json request
        endpoint = f"{self.base_url}/applications/{self.app_id}/devices"

        data = {"end_device": end_device.data}

        req = self.session.post(endpoint, json=data)
        if req.status_code == 200:
            return end_device.update(req.json())
        elif req.status_code == 409:
            warnings.warn(
                f"End Device with device_id '{end_device.data['ids']['device_id']}' already exists."
            )
            return end_device.update(req.json())
        else:
            warnings.warn(
                f"Failed to create End Device on TTN: {req.status_code} - {req.text}"
            )
            return None

    def get_all(
        self,
        field_mask: str | None = None,
        order: str | None = None,
        limit: int | None = None,
        page: int | None = None,
    ) -> list[EndDevice] | None:
        """Get all End Devices in the registry.

        The parameter `order` specifies the field mask to order the results by.
        Default ordering is by ID Prepend with a minus (-) to reverse the
        order.

        Args:
            field_mask: List of fields to include in the response.
            order: Order of the results by field mask.
            limit: Maximum number of results to return per page.
            page: Page number to retrieve.

        Returns:
            List of EndDevice objects.
        """

        params = {}

        if field_mask is not None:
            params["field_mask"] = field_mask

        if order is not None:
            params["order"] = order

        if limit is not None:
            params["limit"] = limit

        if page is not None:
            params["page"] = page

        endpoint = f"{self.base_url}/applications/{self.app_id}/devices"

        req = self.session.get(endpoint, params=params)
        if req.status_code != 200:
            warnings.warn(
                f"ttn: Failed to get End Devices from TTN: {req.status_code} - {req.text}"
            )
            return None

        end_devices = []

        for e in req.json()["end_devices"]:
            end_devices.append(EndDevice(e))

        return end_devices

    def get_list(
        self,
        field_mask: str | None = None,
        order: str | None = None,
        limit: int | None = None,
        page: int | None = None,
        filters: dict[str, str] | None = None,
    ) -> list[EndDevice] | None:
        """Get all End Devices in the registry

        The parameter `order` specifies the field mask to order the results by.
        Default ordering is by ID Prepend with a minus (-) to reverse the
        order.

        Example filters:
            filters = {
                "updated_since": "2025-04-23T18:25:43.511Z"
            }

        Args:
            field_mask: List of fields to include in the response.
            order: Order of the results by field mask.
            limit: Maximum number of results to return per page.
            page: Page number to retrieve.
            filters: Dictionary of filters to apply to the results.

        Returns:
            List of EndDevice objects.
        """

        data = {}

        if field_mask is not None:
            data["field_mask"] = field_mask

        if order is not None:
            data["order"] = order

        if limit is not None:
            data["limit"] = limit

        if page is not None:
            data["page"] = page

        if filters is not None:
            data["filters"] = [filters]

        endpoint = f"{self.base_url}/applications/{self.app_id}/devices/filter"

        req = self.session.post(endpoint, json=data)
        if req.status_code != 200:
            warnings.warn(
                f"ttn: Failed to get End Devices from TTN: {req.status_code} - {req.text}"
            )
            return None

        end_devices = []

        for e in req.json()["end_devices"]:
            end_devices.append(EndDevice(e))

        return end_devices

    def delete(self, end_device: EndDevice) -> bool:
        """Delete an EndDevice from the registry.

        The end device must have ["ids"]["device_id"] set.

        If the EndDevice does not exist then the method will return False. The
        method only returns true if the DELETE request was successful.

        Args:
            end_device: The EndDevice object to delete.

        Raises:
            ValueError: If the EndDevice does not have the required fields.

        Returns:
            True if the EndDevice was successfully deleted, False otherwise.
        """

        if "ids" not in end_device.data or "device_id" not in end_device.data["ids"]:
            raise ValueError("EndDevice must have 'ids' and 'device_id' set.")

        device_id = end_device.data["ids"]["device_id"]

        endpoint = f"{self.base_url}/applications/{self.app_id}/devices/{device_id}"
        req = self.session.delete(endpoint)

        # print warning if the request was not successful
        if req.status_code == 404:
            warnings.warn(f"ttn: End Device with device_id '{device_id}' not found.")

            return False

        elif req.status_code != 200:
            warnings.warn(
                f"ttn: Failed to delete End Device on TTN: {req.status_code} - {req.text}"
            )

            return False

        return True

    def update(self, end_device: EndDevice) -> bool:
        """Update an End Device in the registry.

        The end device must have ["ids"]["device_id"] set.

        Args:
            end_device: The EndDevice object to update.

        Raises:
            ValueError: If the EndDevice does not have the required fields.

        Returns:
            True if the EndDevice was successfully updated, False otherwise.
        """

        # check that device_id is set
        if "ids" not in end_device.data or "device_id" not in end_device.data["ids"]:
            raise ValueError("EndDevice must have 'ids' and 'device_id' set.")

        # send request
        data = {"end_device": end_device.data}
        endpoint = f"{self.base_url}/applications/{self.app_id}/devices/{end_device.data['ids']['device_id']}"
        req = self.session.put(endpoint, json=data)
        if req.status_code != 200:
            warnings.warn(
                f"ttn: Failed to update end device on TTN: {req.status_code} - {req.text}"
            )
            return False

        return True

    def get(
        self,
        end_device: EndDevice,
        field_mask: list[str] | None = None,
    ) -> EndDevice | None:
        """Get an End Device from the registry.

        The end device must have ["ids"]["device_id"] set.

        Args:
            end_device: The EndDevice object to get.

        Raises:
            ValueError: If the EndDevice does not have the required fields.

        Returns:
            The EndDevice object if found, None otherwise.
        """

        if "ids" not in end_device.data or "device_id" not in end_device.data["ids"]:
            raise ValueError("EndDevice must have 'ids' and 'device_id' set.")

        params = {}

        if field_mask is not None:
            params["field_mask"] = field_mask

        device_id = end_device.data["ids"]["device_id"]
        endpoint = f"{self.base_url}/applications/{self.app_id}/devices/{device_id}"
        req = self.session.get(endpoint, params=params)

        if req.status_code != 200:
            warnings.warn(f"ttn: End Device with device_id '{device_id}' not found.")
            return None

        return end_device.update(req.json())


class JoinServerDeviceRegistry(TTNApiEndpoint):
    def create(
        self,
        end_device: EndDevice,
    ) -> EndDevice | None:
        """Create a new End Device in the Join Server registry.

         Args:
              end_device: The End Device object to create.

        Returns:
            The created End Device object.
        """

        endpoint = f"{self.base_url}/js/applications/{self.app_id}/devices"

        data = {"end_device": end_device.data}

        req = self.session.post(endpoint, json=data)
        if req.status_code != 200:
            warnings.warn(
                f"ttn: Failed to create end device on js: {req.status_code} - {req.text}"
            )
            return None

        return end_device.update(req.json())

    def get():
        pass

    def delete(
        self,
        end_device: EndDevice,
    ) -> bool:
        """Delete an End Device from the Join Server registry.

        Args:
            end_device: The End Device object to delete.

        Raises:
            ValueError: If the EndDevice does not have the required fields.

        Returns:
            True if the End Device was successfully deleted, False otherwise.
        """

        device_id = end_device.data["ids"]["device_id"]

        endpoint = f"{self.base_url}/js/applications/{self.app_id}/devices/{device_id}"

        req = self.session.delete(endpoint)

        if req.status_code != 200:
            warnings.warn(
                f"ttn: Failed to delete end device on JS: {req.status_code} - {req.text}"
            )
            return False

        return True

    def update():
        pass
