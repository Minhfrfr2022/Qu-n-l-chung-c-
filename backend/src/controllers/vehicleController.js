const{VehicleRepository, vehicleRegistrationRepository} = require("../repositories/vehicleRepository");
const {PAGE_SIZE} = require("../utils/constants");
const { supabaseAdmin } = require("../config/supabase");


class VehicleController { // TODO: add access control 
    // TODO: add middle to verify input
    repo;
    registration;
    constructor() {
        this.repo = new VehicleRepository();
        this.registration = new vehicleRegistrationRepository();
    }

    async insert_new_vehicle(req, res) {
        try {
            if (Array.isArray(req.body)) {
                throw new Error("Only one vehicle can be inserted at a time");
            }
            const {data, error} = await this.repo.insert(req.body);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success", new_vehicle: data})
        }
        catch(error) {
            return res.status(500).json({message: error.message})
        }
    }

    async delete_a_vehicle(req, res) {
        try {
            const {
                number
            } = req.body;
            if(!number) {
                throw new Error("No vehicle number found!");
            }
            const {data, error} = await this.repo.delete(number);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Sucess"});
        }
        catch(error) {
            return res.status(500).json({message: error.message});
        }
    }

    async update_a_vehicle(req, res) {
        try {
            const {
                number,
                new_values
            } = req.body;
            if(!number) {
                throw new Error("No vehicle number found");
            }
            const {data, error} = await this.repo.update(new_values, number);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success", new_vehicle: data});
        }
        catch(error) {
            return res.status(500).json({message: error.message});
        }
    }

    async query_with_filter(req, res) {
        try {
            let result = {}
            const {
                page_number,
                page_size,
                filter
            } = req.query;
            console.log(filter)
            console.log(page_number)
            if(!page_number || !page_size) {
                throw new Error("No page number found!");
            }
            const start = (page_number - 1) * page_size;
            const end = start + page_size - 1;

            const { data, error } = await this.repo.query_with_filter(filter, start, end);

            if(error) {
                throw new Error(error.message);
            }

            result.data = data;
            result.current_page = page_number;
            result.page_size = page_size;
            const {count, error: countError} = await this.repo.count_all_vehicles_with_filter(filter);
            if(countError) {
                console.warn("Unable to retrieve total document: ", countError.message);
            }
            result.total_docs = count || 0;
            result.total_pages = Math.ceil(result.total_docs / page_size);

            return res.status(200).json({message: "Success", result: result});
        }
        catch(error) {
            return res.status(400).json({message: error.message});
        }
    }

    async query_vehicles_by_owner(req, res) {
        try {
            const {
                owner
            } = req.query;
            if(!owner) {
                throw new Error("No owner found");
            } 
            const {data, error} = await this.repo.query_vehicles_by_owner(owner);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success", vehicle_list: data});
        }
        catch(error) {
            return res.status(400).json({message: error.message});
        }
    }

    async query_vehicles_by_type_and_owner(req, res) {
        try {
            const {
                owner, 
                type
            } = req.query;
            if(!owner || !type) {
                throw new Error("No owner or type found!");
            }
            const {data, error} = await this.repo.query_vehicles_by_type_and_owner(type, owner);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success", vehicle_list: data});
        }
        catch(error) {
            return res.status(500).json({message: error.message});
        }
    }

    async query_vehicles_by_apt(req, res) {
        try {
            const {
                apt_id
            } = req.query;
            if(!apt_id) {
                throw new Error("No apt found");
            } 
            const {data, error} = await this.repo.query_vehicles_by_apt(apt_id);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success", vehicle_list: data});
        }
        catch(error) {
            return res.status(400).json({message: error.message});
        }
    }

    async query_vehicles_by_type_and_apt(req, res) {
        try {
            const {
                apt_id, 
                type
            } = req.query;
            if(!apt_id || !type) {
                throw new Error("No apt or type found!");
            }
            const {data, error} = await this.repo.query_vehicles_by_type_and_apt(type, apt_id);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success", vehicle_list: data});
        }
        catch(error) {
            return res.status(500).json({message: error.message});
        }
    }


    async query_all_vehicles(req, res) {
        try {
            let result = {}
            const {
                page_number,
            } = req.query;
            console.log(page_number)
            if(!page_number) {
                throw new Error("No page number found!");
            }
            const start = (page_number - 1) * PAGE_SIZE;
            const end = start + PAGE_SIZE - 1;

            const { data, error } = await this.repo.query_all_with_range(start, end);

            if(error) {
                throw new Error(error.message);
            }

            result.data = data;
            result.current_page = page_number;
            result.page_size = PAGE_SIZE;
            const {count, error: countError} = await this.repo.count_all_vehicles();
            if(countError) {
                console.warn("Unable to retrieve total document: ", countError.message);
            }
            result.total_docs = count || 0;
            result.total_pages = Math.ceil(result.total_docs / PAGE_SIZE);

            return res.status(200).json({message: "Success", result: result});
        }
        catch(error) {
            return res.status(400).json({message: error.message});
        }
    } 

    async query_all_vehicles_with_type(req, res) {
        try {
            let result = {}
            const {
                page_number,
                type
            } = req.query;
            console.log(page_number)
            if(!page_number || !type) {
                throw new Error("No page number or type found!");
            }
            const start = (page_number - 1) * PAGE_SIZE;
            const end = start + PAGE_SIZE - 1;

            const { data, error } = await this.repo.query_all_with_type_and_range(start, end, type);

            if(error) {
                throw new Error(error.message);
            }

            result.data = data;
            result.type = type;
            result.current_page = page_number;
            result.page_size = PAGE_SIZE;
            const {count, error: countError} = await this.repo.count_all_with_type(type);
            if(countError) {
                console.warn("Unable to retrieve total document: ", countError.message);
            }
            result.total_docs = count || 0;
            result.total_pages = Math.ceil(result.total_docs / PAGE_SIZE);

            return res.status(200).json({message: "Success", result: result});
        }
        catch(error) {
            return res.status(400).json({message: error.message});
        }
    } 

    async count_vehicles_by_type_and_apt(req, res) {
        try {
            const {
                apt_id, 
                type
            } = req.query;
            if(!apt_id || !type) {
                throw new Error("No apt or type found!");
            }
            const {count, error} = await this.repo.count_all_with_type_and_apt(type, apt_id);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success", count: count});
        }
        catch(error) {
            return res.status(500).json({message: error.message});
        }
    }

    async count_all_vehicles_by_type(req, res) {
        try {
            const {
                type
            } = req.query;
            if(!type) {
                throw new Error("type found!");
            }
            const {count, error} = await this.repo.count_all_with_type(type);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success", count: count});
        }
        catch(error) {
            return res.status(500).json({message: error.message});
        }
    }

    async new_request(req, res) {
        try {
            if (Array.isArray(req.body)) {
                throw new Error("Only one vehicle can be inserted at a time");
            }
            const {data, error} = await this.registration.insert(req.body);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success", new_request: data});
        }
        catch(error) {
            res.status(500).json({message: error.message});
        }
    }

    async delete_request(req, res) {
        try {
            const {
                number
            } = req.body;
            if(!number) {
                throw new Error("No car found");
            }
            const {data, error} = await this.registration.delete(number);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success"});
        }
        catch(error) {
            res.status(500).json({message: error.message});
        }
    } 

    async update_request(req, res) {
        try {
            const {
                number,
                new_values
            } = req.body;
            if(!number) {
                throw new Error("No vehicle number found");
            }
            const {data, error} = await this.registration.update(new_values, number);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success", new_request: data});
        }
        catch(error) {
            return res.status(500).json({message: error.message});
        }
    }

    async query_all_request(req, res) {
        try {
            let result = {}
            const {
                page_number,
                page_size
            } = req.query;
            console.log(page_number)
            if(!page_number) {
                throw new Error("No page number found!");
            }
            const start = (page_number - 1) * page_size;
            const end = start + page_size - 1;

            const { data, error } = await this.registration.query_all_with_range(start, end);

            if(error) {
                throw new Error(error.message);
            }

            result.data = data;
            result.current_page = page_number;
            result.page_size = page_size;
            const {count, error: countError} = await this.registration.count_all();
            if(countError) {
                console.warn("Unable to retrieve total document: ", countError.message);
            }
            result.total_docs = count || 0;
            result.total_pages = Math.ceil(result.total_docs / page_size);

            return res.status(200).json({message: "Success", result: result});
        }
        catch(error) {
            return res.status(400).json({message: error.message});
        }
    } 

    async approve_request(req, res) {
        try {
            const { number, monthly_fee } = req.body;
            const userId = req.user?.id || null;
            
            if (!number) {
                throw new Error("Vehicle number is required");
            }
            
            // Get the registration request
            const { data: request, error: fetchErr } = await this.registration.query_by_number(number);
            if (fetchErr || !request) {
                throw new Error("Registration request not found");
            }
            
            // Determine monthly fee based on vehicle type if not provided
            let fee = Number(monthly_fee || 0);
            if (!fee || fee <= 0) {
                const { data: feeConfig, error: feeErr } = await supabaseAdmin
                    .from('vehicle_fee_config')
                    .select('monthly_fee')
                    .eq('type', request.type)
                    .single();
                
                if (!feeErr && feeConfig) {
                    fee = Number(feeConfig.monthly_fee || 0);
                }
            }
            
            // Create vehicle record
            const vehicleData = {
                number: request.number,
                apt_id: request.apt_id,
                owner: request.owner,
                type: request.type,
                color: request.color,
                monthly_fee: fee,
                status: 'active'
            };
            
            const { data: newVehicle, error: insertErr } = await this.repo.insert(vehicleData);
            if (insertErr) {
                throw new Error(`Failed to create vehicle: ${insertErr.message}`);
            }
            
            // Update registration request status
            const updateData = {
                status: 'approved',
                reviewed_by: userId,
                reviewed_at: new Date().toISOString()
            };
            
            const { error: updateErr } = await this.registration.update(updateData, number);
            if (updateErr) {
                console.warn('Failed to update registration status:', updateErr);
            }
            
            return res.status(200).json({
                message: "Vehicle registration approved successfully",
                vehicle: newVehicle
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    
    async reject_request(req, res) {
        try {
            const { number, rejection_reason } = req.body;
            const userId = req.user?.id || null;
            
            if (!number) {
                throw new Error("Vehicle number is required");
            }
            
            // Update registration request status
            const updateData = {
                status: 'rejected',
                reviewed_by: userId,
                reviewed_at: new Date().toISOString(),
                rejection_reason: rejection_reason || 'No reason provided'
            };
            
            const { data, error } = await this.registration.update(updateData, number);
            if (error) {
                throw new Error(error.message);
            }
            
            return res.status(200).json({
                message: "Vehicle registration rejected",
                data: data
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async query_request_by_apt(req, res) {
        try {
            const {
                apt_id
            } = req.query;
            if(!apt_id) {
                throw new Error("No apt found");
            } 
            const {data, error} = await this.registration.query_request_by_apt(apt_id);
            if(error) {
                throw new Error(error.message);
            }
            return res.status(200).json({message: "Success", request_list: data});
        }
        catch(error) {
            return res.status(400).json({message: error.message});
        }
    }

}

module.exports = {
    VehicleController
};